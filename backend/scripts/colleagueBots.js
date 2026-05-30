#!/usr/bin/env node
/**
 * Симуляция «коллег» для функционального и нагрузочного тестирования без второго клиента.
 *
 * Yjs (проект / задача) — боты подключаются к WebSocket и шлют LWW-writes на ваш экран.
 * Чат — боты логинятся через REST и отправляют сообщения (доставка через RabbitMQ → WS).
 *
 * Примеры:
 *
 *   # Функциональный тест задачи (откройте задачу в приложении в режиме редактирования)
 *   node scripts/colleagueBots.js collab --kind task --id <task_id>
 *
 *   # Функциональный тест проекта
 *   node scripts/colleagueBots.js collab --kind project --id <project_id>
 *
 *   # Нагрузка: 5 ботов правят одну задачу 30 секунд
 *   node scripts/colleagueBots.js collab-load --kind task --id <task_id> --bots 5 --duration 30
 *
 *   # Чат: бот пишет вам (откройте чат с maria.sidorova в «Коллеги»)
 *   node scripts/colleagueBots.js chat --peer-id <ваш_user_id> --bot-email maria.sidorova@example.com --bot-password securePass456
 *
 *   # Нагрузка чата: несколько ботов шлют сообщения
 *   node scripts/colleagueBots.js chat-load --peer-id <ваш_user_id> --bots 3 --duration 20
 *
 * Переменные окружения: WS_BASE (default ws://localhost:8080), API_BASE (default http://localhost:8080)
 */

import { CollabBotClient, runFunctionalScenario, runLoadScenario } from './collabBotClient.js';
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
  collab        один бот — пошаговое изменение полей (функциональный тест Yjs)
  collab-load   несколько ботов — параллельные правки (нагрузочный тест Yjs)
  chat          один бот — серия сообщений в чат (функциональный тест)
  chat-load     несколько ботов — поток сообщений (нагрузочный тест чата)

Опции collab / collab-load:
  --kind        task | project          (обязательно)
  --id          UUID задачи или проекта  (обязательно)
  --ws-base     ws://host:8080           (default: WS_BASE env или localhost)
  --bot-id      UUID бота для collab     (default: синтетический bbbbbbbb-...)
  --bots        число ботов              (collab-load, default: 3)
  --duration    секунды                  (collab-load, default: 30)
  --interval    мс между правками        (collab-load, default: 800)
  --stagger     мс задержка старта ботов (collab-load, default: 200)

Опции chat / chat-load:
  --peer-id     user_id получателя       (обязательно — вы в приложении)
  --api-base    http://host:8080         (default: API_BASE env или localhost)
  --bot-email   email бота               (chat, default: maria.sidorova@example.com)
  --bot-password пароль бота             (chat, default: securePass456)
  --bots        число ботов              (chat-load, default: 3)
  --duration    секунды                  (chat-load, default: 20)
  --interval    мс между сообщениями     (default: 1500)
  --count       сообщений в chat         (default: 5)
`;

// Сохраняем в памяти 8 id пользователей
const user_ids = [];
for (let i = 0; i <= 8; i++) {
  const acc = SEED_BOT_ACCOUNTS[i];
  const auth = await apiLogin(DEFAULT_API_BASE, acc.email, acc.password);
  user_ids[i] = {user_id: auth.userId};
}

async function cmdCollab(args) {
  requireArgs(args, ['kind', 'id']);
  if (args.kind !== 'task' && args.kind !== 'project') {
    throw new Error('--kind должен быть task или project');
  }

  const bot = new CollabBotClient({
    wsBase: args['ws-base'] ?? DEFAULT_WS_BASE,
    userId: args['bot-id'] ?? user_ids[0].user_id ?? botUserId(0),
    entityKind: args.kind,
    entityId: args.id,
    label: 'collab-bot',
  });

  log('main', `URL: ${bot.url}`);
  log('main', 'Откройте задачу/проект в приложении (режим редактирования) и наблюдайте изменения…');

  await bot.connect();
  await runFunctionalScenario(bot, args.kind);
  await bot.disconnect();
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

  const bots = Array.from({ length: botCount }, (_, i) =>
    new CollabBotClient({
      wsBase,
      userId: user_ids[i].user_id ?? botUserId(i),
      entityKind: args.kind,
      entityId: args.id,
      label: `bot-${i + 1}`,
    })
  );

  log('main', `${botCount} ботов → ${args.kind}/${args.id}`);
  log('main', 'Откройте сущность в приложении и следите за конфликтами LWW и индикаторами редакторов…');

  try {
    await runLoadScenario(bots, args.kind, { durationMs, intervalMs, staggerMs });
  } finally {
    await Promise.all(bots.map((b) => b.disconnect()));
  }
}

async function cmdChat(args) {
  requireArgs(args, ['peer-id']);
  const apiBase = args['api-base'] ?? DEFAULT_API_BASE;
  const email = args['bot-email'] ?? SEED_BOT_ACCOUNTS[0].email;
  const password = args['bot-password'] ?? SEED_BOT_ACCOUNTS[0].password;
  const count = args.count ?? 5;
  const intervalMs = args.interval ?? 1500;

  const { accessToken, userId: botUser } = await apiLogin(apiBase, email, password);
  log('chat-bot', `вошли как ${email} (${botUser})`);

  const chatId = await apiGetOrCreateChat(apiBase, accessToken, botUser, args['peer-id']);
  log('chat-bot', `chat_id=${chatId}, peer=${args['peer-id']}`);
  log('main', 'Откройте чат с этим коллегой в приложении…');

  const phrases = [
    'Привет! Это тестовое сообщение от бота.',
    'Проверяем доставку через WebSocket.',
    'Видите это сообщение в реальном времени?',
    'Следующее сообщение через несколько секунд.',
    'Функциональный тест чата завершён ✓',
    'Ещё одно сообщение для проверки прокрутки.',
    'Бот продолжает писать…',
    'Последнее сообщение серии.',
  ];

  for (let i = 0; i < count; i++) {
    if (i > 0) await sleep(intervalMs);
    const text = `[бот ${i + 1}/${count}] ${phrases[i % phrases.length]}`;
    await apiSendChatMessage(apiBase, accessToken, botUser, chatId, text);
    log('chat-bot', `отправлено: ${text}`);
  }

  log('chat-bot', 'готово');
}

async function cmdChatLoad(args) {
  requireArgs(args, ['peer-id']);
  const apiBase = args['api-base'] ?? DEFAULT_API_BASE;
  const botCount = Math.min(args.bots ?? 3, SEED_BOT_ACCOUNTS.length);
  const durationMs = (args.duration ?? 20) * 1000;
  const intervalMs = args.interval ?? 1200;
  const stopAt = Date.now() + durationMs;

  log('main', `нагрузка чата: ${botCount} ботов → peer ${args['peer-id']}, ${durationMs / 1000}s`);

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

  log('main', 'Откройте чат с любым из ботов или переключайтесь между коллегами…');

  let round = 0;
  while (Date.now() < stopAt) {
    const session = sessions[round % sessions.length];
    const text = `[load r${round + 1}] ${session.email.split('@')[0]}: ping ${Date.now() % 100000}`;
    await apiSendChatMessage(apiBase, session.accessToken, session.userId, session.chatId, text);
    session.sent += 1;
    log(`bot-${(round % sessions.length) + 1}`, text);
    round += 1;
    await sleep(intervalMs);
  }

  const total = sessions.reduce((s, x) => s + x.sent, 0);
  log('load', `отправлено сообщений: ${total}`);
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
        'bot-email': { name: 'bot-email', type: 'string' },
        'bot-password': { name: 'bot-password', type: 'string' },
        count: { name: 'count', type: 'number' },
        interval: { name: 'interval', type: 'number' },
      },
    },
    'chat-load': {
      fn: cmdChatLoad,
      specs: {
        'peer-id': { name: 'peer-id', type: 'string' },
        'api-base': { name: 'api-base', type: 'string' },
        bots: { name: 'bots', type: 'number' },
        duration: { name: 'duration', type: 'number' },
        interval: { name: 'interval', type: 'number' },
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
