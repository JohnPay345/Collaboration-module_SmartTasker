import { randomUUID } from 'node:crypto';

/** @typedef {{ name: string; type: 'string' | 'boolean' | 'number' | 'array' }} ArgSpec */

export const DEFAULT_WS_BASE = process.env.WS_BASE || 'ws://localhost:8080';
export const DEFAULT_API_BASE = process.env.API_BASE || 'http://localhost:8080';

/** Тестовые аккаунты из psql-config/insert-data.sql */
export const SEED_BOT_ACCOUNTS = [
  { email: 'maria.sidorova@example.com', password: 'securePass456' },
  { email: 'petr.smirnov@example.com', password: 'strongPassword789' },
  { email: 'elena.kuznetsova@example.com', password: 'mySecretPass101' },
  { email: 'alexey.sokolov@example.com', password: 'complexPassword202' },
  { email: 'olga.volkova@example.com', password: 'topSecret303' },
  { email: 'dmitry.morozov@example.com', password: 'verySecurePass404' },
  { email: 'natalia.lebedeva@example.com', password: 'hiddenPass505' },
  { email: 'sergey.kozlov@example.com', password: 'ultraSecret606' },
  { email: 'svetlana.vinogradova@example.com', password: 'superSecure707' },
];

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function botUserId(index = 0) {
  const n = String(index + 1).padStart(8, '0');
  return `bbbbbbbb-bbbb-4bbb-8bbb-${n}000000000`.slice(0, 36);
}

export function randomBotUserId() {
  return randomUUID();
}

/**
 * @param {string[]} argv
 * @param {Record<string, ArgSpec>} specs
 */
export function parseArgs(argv, specs) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, spec] of Object.entries(specs)) {
    if (spec.type === 'boolean') out[key] = false;
    else if (spec.type === 'number') out[key] = undefined;
    else out[key] = undefined;
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const eq = token.indexOf('=');
    const rawKey = eq === -1 ? token.slice(2) : token.slice(2, eq);
    const spec = specs[rawKey];
    if (!spec) continue;

    let value;
    if (eq !== -1) {
      value = token.slice(eq + 1);
    } else if (spec.type === 'boolean') {
      value = true;
    } else {
      value = argv[++i];
    }

    if (spec.type === 'number') out[rawKey] = Number(value);
    else if (spec.type === 'boolean') out[rawKey] = value === true || value === 'true';
    else out[rawKey] = value;
  }
  return out;
}

export function requireArgs(args, requiredKeys) {
  const missing = requiredKeys.filter((k) => args[k] === undefined || args[k] === '');
  if (missing.length) {
    throw new Error(`Не хватает аргументов: ${missing.map((k) => `--${k}`).join(', ')}`);
  }
}

export async function apiLogin(apiBase, email, password) {
  const res = await fetch(`${apiBase}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(body.message ?? body)}`);
  }
  const msg = body.message;
  if (!msg?.access_token || !msg?.user_id) {
    throw new Error('Login response missing access_token or user_id');
  }
  return { accessToken: msg.access_token, userId: msg.user_id };
}

export async function apiGetOrCreateChat(apiBase, accessToken, userId, peerId) {
  const res = await fetch(`${apiBase}/api/chats/${userId}/with/${peerId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`getOrCreateChat failed (${res.status}): ${JSON.stringify(body.message ?? body)}`);
  }
  const chatId = body.message?.chat_id ?? body.result?.chat_id;
  if (!chatId) throw new Error('Chat id not found in response');
  return chatId;
}

export async function apiSendChatMessage(apiBase, accessToken, userId, chatId, messageText) {
  const res = await fetch(`${apiBase}/api/chats/${userId}/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { message_text: messageText } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`sendMessage failed (${res.status}): ${JSON.stringify(body.message ?? body)}`);
  }
  return body.message ?? body.result;
}

export function formatTs() {
  return new Date().toISOString().slice(11, 19);
}

export function log(tag, message) {
  console.log(`[${formatTs()}] [${tag}] ${message}`);
}
