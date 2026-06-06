#!/usr/bin/env node
/**
 * Симуляция «коллег» + метрики (время отклика и пропускная способность).
 *
 * Collab: отклик = время от отправки write (t на отправителе) до получения другим ботом.
 * Chat:   отклик REST = POST /messages; E2E = POST → RabbitMQ → WS у получателя.
 *
 * node scripts/colleagueBots.js --help
 */

import {
  CollabBotClient,
  aggregateCollabMetrics,
  runFunctionalScenario,
  runLoadScenario,
} from './collabBotClient.js';
import { MetricsCollector, printCombinedReport } from './botMetrics.js';
import {
  ChatWsListener,
  embedLatencyToken,
  makeLatencyToken,
} from './chatWsListener.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_WS_BASE,
  SEED_BOT_ACCOUNTS,
  apiGetOrCreateChat,
  apiLogin,
  apiSendChatMessage,
  botUserId,
  log,
  parseArgs,
  requireArgs,
  sleep,
} from './botHelpers.js';

const USAGE = `
Использование:
  node scripts/colleagueBots.js <команда> [опции]

Команды:
  collab        функциональный тест Yjs + метрики
  collab-load   нагрузочный тест Yjs + метрики
  chat          функциональный тест чата + метрики
  chat-load     нагрузочный тест чата + метрики

Метрики (в конце каждого теста):
  • Время отклика (мс): мин / макс / сред / p95
  • Пропускная способность (событий/с по секундным окнам): мин / макс / сред

Опции collab / collab-load:
  --kind        task | project
  --id          UUID задачи или проекта
  --ws-base     ws://host:8080
  --bot-id      UUID бота (collab)
  --bots        число ботов (collab-load, default: 3)
  --duration    секунды (collab-load, default: 30)
  --interval    мс между правками (collab-load, default: 800)
  --stagger     мс задержка старта ботов (collab-load, default: 200)

Опции chat / chat-load:
  --peer-id     user_id получателя (вы в приложении)
  --api-base    http://host:8080
  --bot-email   email бота (chat)
  --bot-password пароль бота (chat)
  --bots        число ботов (chat-load, default: 3)
  --duration    секунды (chat-load, default: 20)
  --interval    мс между сообщениями
  --count       сообщений (chat, default: 5)
  --e2e         измерять E2E через WS listener на peer-id (⚠ закройте приложение — иначе WS перехватится)
`;

/** @type {Map<number, { user_id: string }> | null} */
let cachedSeedUsers = null;

async function getSeedUser(index) {
  if (!cachedSeedUsers) {
    cachedSeedUsers = new Map();
    for (let i = 0; i < SEED_BOT_ACCOUNTS.length; i++) {
      try {
        const acc = SEED_BOT_ACCOUNTS[i];
        const auth = await apiLogin(DEFAULT_API_BASE, acc.email, acc.password);
        cachedSeedUsers.set(i, { user_id: auth.userId });
      } catch {
        cachedSeedUsers.set(i, { user_id: botUserId(i) });
      }
    }
  }
  return cachedSeedUsers.get(index)?.user_id ?? botUserId(index);
}

async function cmdCollab(args) {
  requireArgs(args, ['kind', 'id']);
  if (args.kind !== 'task' && args.kind !== 'project') {
    throw new Error('--kind должен быть task или project');
  }

  const wsBase = args['ws-base'] ?? DEFAULT_WS_BASE;
  const senderId = args['bot-id'] ?? (await getSeedUser(0));
  const observerId = await getSeedUser(1);

  const senderMetrics = new MetricsCollector('collab: отправка writes');
  const receiverMetrics = new MetricsCollector('collab: получение writes (наблюдатель)');

  const sender = new CollabBotClient({
    wsBase,
    userId: senderId,
    entityKind: args.kind,
    entityId: args.id,
    label: 'sender',
    metrics: senderMetrics,
  });

  const observer = new CollabBotClient({
    wsBase,
    userId: observerId,
    entityKind: args.kind,
    entityId: args.id,
    label: 'observer',
    metrics: receiverMetrics,
  });

  log('main', `sender=${senderId.slice(0, 8)}… observer=${observerId.slice(0, 8)}…`);
  log('main', 'Откройте сущность в приложении и наблюдайте изменения…');

  await observer.connect();
  await sender.connect();
  senderMetrics.startedAt = Date.now();
  receiverMetrics.startedAt = senderMetrics.startedAt;

  await runFunctionalScenario(sender, args.kind);

  await sleep(2000);
  senderMetrics.finish();
  receiverMetrics.finish();

  await sender.disconnect();
  await observer.disconnect();

  printCombinedReport('Collab — функциональный тест', [senderMetrics, receiverMetrics], [
    'отклик на observer = задержка доставки Yjs write другому клиенту',
    `writes отправлено: ${sender.writesSent}, updates у observer: ${observer.updatesReceived}`,
  ]);
}

async function cmdCollabLoad(args) {
  requireArgs(args, ['kind', 'id']);
  if (args.kind !== 'task' && args.kind !== 'project') {
    throw new Error('--kind должен быть task или project');
  }

  const botCount = args.bots ?? 3;
  const durationMs = (args.duration ?? 30) * 1000;
  const intervalMs = args.interval ?? 800;
  const staggerMs = args.stagger ?? 200;
  const wsBase = args['ws-base'] ?? DEFAULT_WS_BASE;
  const startedAt = Date.now();

  const bots = await Promise.all(
    Array.from({ length: botCount }, async (_, i) =>
      new CollabBotClient({
        wsBase,
        userId: await getSeedUser(i),
        entityKind: args.kind,
        entityId: args.id,
        label: `bot-${i + 1}`,
        metrics: new MetricsCollector(`collab bot-${i + 1}`),
      })
    )
  );

  log('main', `${botCount} ботов → ${args.kind}/${args.id}`);

  try {
    await runLoadScenario(bots, args.kind, { durationMs, intervalMs, staggerMs });
  } finally {
    const endedAt = Date.now();
    for (const b of bots) b.metrics?.finish(endedAt);
    await Promise.all(bots.map((b) => b.disconnect()));
  }

  const aggregate = aggregateCollabMetrics(bots, 'collab-load (все боты)');
  aggregate.startedAt = startedAt;
  aggregate.finish();

  printCombinedReport('Collab — нагрузочный тест', [aggregate], [
    'отклик = время от t write отправителя до получения другим ботом',
    'пропускная способность = число полученных remote writes в секунду',
    `ботов: ${botCount}, writes всего: ${bots.reduce((s, b) => s + b.writesSent, 0)}`,
  ]);
}

async function cmdChat(args) {
  requireArgs(args, ['peer-id']);
  const apiBase = args['api-base'] ?? DEFAULT_API_BASE;
  const wsBase = args['ws-base'] ?? DEFAULT_WS_BASE;
  const measureE2e = args.e2e === true;
  const email = args['bot-email'] ?? SEED_BOT_ACCOUNTS[0].email;
  const password = args['bot-password'] ?? SEED_BOT_ACCOUNTS[0].password;
  const count = args.count ?? 5;
  const intervalMs = args.interval ?? 1500;

  const restMetrics = new MetricsCollector('chat: REST POST /messages');
  const { accessToken, userId: botUser } = await apiLogin(apiBase, email, password);
  const chatId = await apiGetOrCreateChat(apiBase, accessToken, botUser, args['peer-id']);

  /** @type {ChatWsListener | null} */
  let listener = null;
  if (measureE2e) {
    listener = new ChatWsListener({ wsBase, userId: args['peer-id'], chatId });
    log('main', '⚠ --e2e: WS listener на peer-id — закройте приложение, иначе соединение перехватится');
    await listener.connect();
  } else {
    log('main', 'E2E не измеряется (добавьте --e2e без открытого приложения). REST-метрики активны.');
  }

  log('chat-bot', `${email} → chat ${chatId}, peer ${args['peer-id']}`);

  restMetrics.startedAt = Date.now();
  if (listener) listener.metrics.startedAt = restMetrics.startedAt;

  const phrases = [
    'Привет! Тестовое сообщение от бота.',
    'Проверяем доставку через WebSocket.',
    'Видите это в реальном времени?',
    'Следующее сообщение через несколько секунд.',
    'Функциональный тест чата завершён.',
  ];

  for (let i = 0; i < count; i++) {
    if (i > 0) await sleep(intervalMs);
    const token = makeLatencyToken();
    const text = embedLatencyToken(`[бот ${i + 1}/${count}] ${phrases[i % phrases.length]}`, token);
    if (listener) listener.registerPending(token);
    const { restLatencyMs } = await apiSendChatMessage(apiBase, accessToken, botUser, chatId, text);
    restMetrics.recordLatency(restLatencyMs);
    restMetrics.recordEvent();
    log('chat-bot', `REST ${restLatencyMs} ms — ${text.slice(0, 55)}…`);
    if (listener) await listener.waitForPending(8000);
  }

  restMetrics.finish();
  const collectors = [restMetrics];
  const extra = ['REST = время ответа POST /messages'];
  if (listener) {
    listener.finish();
    listener.disconnect();
    collectors.push(listener.metrics);
    extra.push('E2E = POST → RabbitMQ → WS у peer-id');
    if (listener.pending.size) {
      extra.push(`⚠ не доставлено по WS: ${listener.pending.size}`);
    }
  }
  printCombinedReport('Chat — функциональный тест', collectors, extra);
}

async function cmdChatLoad(args) {
  requireArgs(args, ['peer-id']);
  const apiBase = args['api-base'] ?? DEFAULT_API_BASE;
  const wsBase = args['ws-base'] ?? DEFAULT_WS_BASE;
  const measureE2e = args.e2e === true;
  const botCount = Math.min(args.bots ?? 3, SEED_BOT_ACCOUNTS.length);
  const durationMs = (args.duration ?? 20) * 1000;
  const intervalMs = args.interval ?? 1200;
  const stopAt = Date.now() + durationMs;

  log('main', `нагрузка чата: ${botCount} ботов → peer ${args['peer-id']}, ${durationMs / 1000}s`);

  const restMetrics = new MetricsCollector('chat-load: REST');
  /** @type {ChatWsListener | null} */
  let listener = null;
  if (measureE2e) {
    listener = new ChatWsListener({ wsBase, userId: args['peer-id'] });
    log('main', '⚠ --e2e: закройте приложение на peer-id');
    await listener.connect();
  }

  /** @type {{ accessToken: string; userId: string; email: string; chatId: string; sent: number }[]} */
  const sessions = [];

  for (let i = 0; i < botCount; i++) {
    const acc = SEED_BOT_ACCOUNTS[i];
    const auth = await apiLogin(apiBase, acc.email, acc.password);
    const chatId = await apiGetOrCreateChat(apiBase, auth.accessToken, auth.userId, args['peer-id']);
    sessions.push({
      accessToken: auth.accessToken,
      userId: auth.userId,
      email: acc.email,
      chatId,
      sent: 0,
    });
    log(`bot-${i + 1}`, `${acc.email} → chat ${chatId}`);
  }

  restMetrics.startedAt = Date.now();
  if (listener) listener.metrics.startedAt = restMetrics.startedAt;

  log('main', `${botCount} ботов → peer ${args['peer-id']}, ${durationMs / 1000}s`);

  let round = 0;
  while (Date.now() < stopAt) {
    const session = sessions[round % sessions.length];
    const token = makeLatencyToken();
    const text = embedLatencyToken(
      `[load r${round + 1}] ${session.email.split('@')[0]}: ping`,
      token
    );
    if (listener) listener.registerPending(token);
    const { restLatencyMs } = await apiSendChatMessage(
      apiBase,
      session.accessToken,
      session.userId,
      session.chatId,
      text
    );
    restMetrics.recordLatency(restLatencyMs);
    restMetrics.recordEvent();
    session.sent += 1;
    log(`bot-${(round % sessions.length) + 1}`, text);
    round += 1;
    if (listener) {
      await listener.waitForPending(5000);
    }
    await sleep(intervalMs);
  }

  restMetrics.finish();
  const collectors = [restMetrics];
  const extra = [`отправлено REST: ${sessions.reduce((s, x) => s + x.sent, 0)}`];
  if (listener) {
    listener.finish();
    listener.disconnect();
    collectors.push(listener.metrics);
    if (listener.pending.size) extra.push(`не подтверждено WS: ${listener.pending.size}`);
  }
  printCombinedReport('Chat — нагрузочный тест', collectors, extra);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE.trim());
    process.exit(command ? 0 : 1);
  }

  const handlers = {
    collab: {
      fn: cmdCollab,
      specs: {
        kind: { name: 'kind', type: 'string' },
        id: { name: 'id', type: 'string' },
        'ws-base': { name: 'ws-base', type: 'string' },
        'bot-id': { name: 'bot-id', type: 'string' },
      },
    },
    'collab-load': {
      fn: cmdCollabLoad,
      specs: {
        kind: { name: 'kind', type: 'string' },
        id: { name: 'id', type: 'string' },
        'ws-base': { name: 'ws-base', type: 'string' },
        bots: { name: 'bots', type: 'number' },
        duration: { name: 'duration', type: 'number' },
        interval: { name: 'interval', type: 'number' },
        stagger: { name: 'stagger', type: 'number' },
      },
    },
    chat: {
      fn: cmdChat,
      specs: {
        'peer-id': { name: 'peer-id', type: 'string' },
        'api-base': { name: 'api-base', type: 'string' },
        'ws-base': { name: 'ws-base', type: 'string' },
        'bot-email': { name: 'bot-email', type: 'string' },
        'bot-password': { name: 'bot-password', type: 'string' },
        count: { name: 'count', type: 'number' },
        interval: { name: 'interval', type: 'number' },
        e2e: { name: 'e2e', type: 'boolean' },
      },
    },
    'chat-load': {
      fn: cmdChatLoad,
      specs: {
        'peer-id': { name: 'peer-id', type: 'string' },
        'api-base': { name: 'api-base', type: 'string' },
        'ws-base': { name: 'ws-base', type: 'string' },
        bots: { name: 'bots', type: 'number' },
        duration: { name: 'duration', type: 'number' },
        interval: { name: 'interval', type: 'number' },
        e2e: { name: 'e2e', type: 'boolean' },
      },
    },
  };

  const handler = handlers[command];
  if (!handler) {
    console.error(`Неизвестная команда: ${command}\n`);
    console.log(USAGE.trim());
    process.exit(1);
  }

  const args = parseArgs(rest, handler.specs);
  try {
    await handler.fn(args);
  } catch (e) {
    console.error(`\nОшибка: ${e.message}`);
    if (e.cause) console.error(e.cause);
    process.exit(1);
  }
}

main();
