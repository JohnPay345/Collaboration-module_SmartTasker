import WebSocket from 'ws';
import * as Y from 'yjs';
import { log, sleep } from './botHelpers.js';

export class CollabBotClient {
  /**
   * @param {{ wsBase: string; userId: string; entityKind: 'task' | 'project'; entityId: string; label?: string }} opts
   */
  constructor(opts) {
    this.wsBase = opts.wsBase.replace(/\/$/, '');
    this.userId = opts.userId;
    this.entityKind = opts.entityKind;
    this.entityId = opts.entityId;
    this.label = opts.label ?? opts.userId.slice(0, 8);
    this.doc = new Y.Doc();
    /** @type {WebSocket | null} */
    this.ws = null;
    this.connected = false;
    this.writesSent = 0;
    this.updatesReceived = 0;
    /** @type {((update: Uint8Array) => void) | null} */
    this.onRemoteUpdate = null;

    this._onDocUpdate = (update, origin) => {
      if (origin === 'remote') return;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      try {
        this.ws.send(Buffer.from(update));
      } catch (e) {
        log(this.label, `ошибка отправки update: ${e.message}`);
      }
    };
  }

  get url() {
    return `${this.wsBase}/ws/yjs/${encodeURIComponent(this.userId)}/${this.entityKind}/${encodeURIComponent(this.entityId)}`;
  }

  async connect(timeoutMs = 15000) {
    if (this.connected) return;

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.binaryType = 'arraybuffer';

      const timer = setTimeout(() => {
        ws.terminate();
        reject(new Error(`timeout подключения к ${this.url}`));
      }, timeoutMs);

      this.doc.on('update', this._onDocUpdate);

      ws.on('message', (data) => {
        try {
          const u8 =
            data instanceof Buffer
              ? new Uint8Array(data)
              : new Uint8Array(data instanceof ArrayBuffer ? data : Buffer.from(data));
          Y.applyUpdate(this.doc, u8, 'remote');
          this.updatesReceived += 1;
          this.onRemoteUpdate?.(u8);
          if (!this.connected) {
            this.connected = true;
            clearTimeout(timer);
            log(this.label, `подключён к ${this.entityKind}/${this.entityId}`);
            resolve();
          }
        } catch (e) {
          log(this.label, `ошибка applyUpdate: ${e.message}`);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      ws.on('close', () => {
        this.connected = false;
      });
    });
  }

  /** @param {string} field @param {unknown} value */
  pushWrite(field, value) {
    const entry = { field, v: value, t: Date.now(), u: this.userId };
    this.doc.transact(() => {
      this.doc.getArray('writes').push([entry]);
    });
    this.writesSent += 1;
    log(this.label, `write ${field} = ${JSON.stringify(value)}`);
    return entry;
  }

  materializedFields() {
    const arr = this.doc.getArray('writes');
    /** @type {Record<string, { v: unknown; t: number; u: string }>} */
    const cells = {};
    arr.forEach((item) => {
      const e = item instanceof Y.AbstractType ? item.toJSON() : item;
      if (!e || typeof e.field !== 'string') return;
      const t = Number(e.t) || 0;
      const u = String(e.u ?? '');
      const prev = cells[e.field];
      if (!prev || t > prev.t || (t === prev.t && u > prev.u)) {
        cells[e.field] = { v: e.v, t, u };
      }
    });
    return cells;
  }

  async disconnect() {
    this.doc.off('update', this._onDocUpdate);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.doc.destroy();
    this.connected = false;
  }
}

/** @typedef {{ field: string; value: unknown; delayMs?: number; label?: string }} CollabScenarioStep */

/** @type {Record<'task' | 'project', CollabScenarioStep[]>} */
export const FUNCTIONAL_SCENARIOS = {
  task: [
    { field: 'task_name', value: '[Бот] Обновлённое название задачи', delayMs: 2000, label: 'название' },
    { field: 'description', value: 'Описание изменено ботом для проверки совместного редактирования.', delayMs: 2500, label: 'описание' },
    { field: 'status', value: 'В работе', delayMs: 2000, label: 'статус' },
    { field: 'is_urgent', value: true, delayMs: 1500, label: 'срочность' },
    { field: 'priority', value: '5', delayMs: 1500, label: 'приоритет' },
    { field: 'value', value: '4', delayMs: 1500, label: 'ценность' },
    { field: 'effort', value: '2', delayMs: 1500, label: 'трудоёмкость' },
    { field: 'estimated_duration', value: 4, delayMs: 1500, label: 'длительность' },
    { field: 'required_skills', value: ['TypeScript', 'React Native', 'Yjs'], delayMs: 2000, label: 'навыки' },
    { field: 'end_date', value: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), delayMs: 2000, label: 'дедлайн' },
  ],
  project: [
    { field: 'project_name', value: '[Бот] Совместный проект', delayMs: 2000, label: 'название' },
    { field: 'description', value: 'Описание проекта изменено ботом.', delayMs: 2500, label: 'описание' },
    { field: 'status', value: 'В работе', delayMs: 2000, label: 'статус' },
    { field: 'tags', value: ['collab', 'yjs', 'test'], delayMs: 2000, label: 'теги' },
  ],
};

const TASK_LOAD_FIELDS = [
  { field: 'task_name', values: ['[Load] Задача A', '[Load] Задача B', '[Load] Задача C'] },
  { field: 'description', values: ['Бот 1 правит описание', 'Бот 2 правит описание', 'Бот 3 правит описание'] },
  { field: 'status', values: ['В работе', 'Черновик', 'Сдана'] },
  { field: 'priority', values: ['1', '3', '5'] },
  { field: 'is_urgent', values: [true, false] },
  { field: 'estimated_duration', values: [1, 3, 5] },
];

const PROJECT_LOAD_FIELDS = [
  { field: 'project_name', values: ['[Load] Проект X', '[Load] Проект Y', '[Load] Проект Z'] },
  { field: 'description', values: ['Load bot 1', 'Load bot 2', 'Load bot 3'] },
  { field: 'status', values: ['В работе', 'Черновик'] },
  { field: 'tags', values: [['alpha'], ['beta', 'gamma'], ['load-test']] },
];

/**
 * @param {CollabBotClient} bot
 * @param {'task' | 'project'} kind
 * @param {CollabScenarioStep[]} [steps]
 */
export async function runFunctionalScenario(bot, kind, steps) {
  const scenario = steps ?? FUNCTIONAL_SCENARIOS[kind];
  log(bot.label, `функциональный сценарий (${scenario.length} шагов)`);
  for (const step of scenario) {
    if (step.delayMs) await sleep(step.delayMs);
    bot.pushWrite(step.field, step.value);
    if (step.label) log(bot.label, `шаг: ${step.label}`);
  }
  await sleep(1000);
  log(bot.label, `готово, отправлено writes: ${bot.writesSent}, получено updates: ${bot.updatesReceived}`);
}

/**
 * @param {CollabBotClient[]} bots
 * @param {'task' | 'project'} kind
 * @param {{ durationMs: number; intervalMs: number; staggerMs?: number }} opts
 */
export async function runLoadScenario(bots, kind, opts) {
  const fields = kind === 'task' ? TASK_LOAD_FIELDS : PROJECT_LOAD_FIELDS;
  const stopAt = Date.now() + opts.durationMs;
  let tick = 0;

  log('load', `старт: ${bots.length} ботов, ${opts.durationMs}ms, интервал ${opts.intervalMs}ms`);

  const runners = bots.map(async (bot, botIndex) => {
    if (opts.staggerMs) await sleep(botIndex * opts.staggerMs);
    await bot.connect();

    while (Date.now() < stopAt) {
      const pick = fields[tick % fields.length];
      const value = pick.values[(tick + botIndex) % pick.values.length];
      bot.pushWrite(pick.field, value);
      tick += 1;
      await sleep(opts.intervalMs);
    }
  });

  await Promise.all(runners);

  const totalWrites = bots.reduce((s, b) => s + b.writesSent, 0);
  const totalUpdates = bots.reduce((s, b) => s + b.updatesReceived, 0);
  log('load', `завершено: writes=${totalWrites}, updates=${totalUpdates}`);
  return { totalWrites, totalUpdates };
}
