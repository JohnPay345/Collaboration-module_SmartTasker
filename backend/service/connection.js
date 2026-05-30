import pg from 'pg';
import { createClient, RESP_TYPES } from 'redis';
import { config } from 'dotenv';

config();

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DBNAME,
  port: process.env.PG_PORT,
});

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';
const redisPassword = process.env.REDIS_PASSWORD || '';

const redisUrl =
  process.env.REDIS_URL ||
  (redisPassword
    ? `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`);

export const redisClient = createClient({
  url: redisUrl,
}).withTypeMapping({
  [RESP_TYPES.BLOB_STRING]: Buffer,
});

redisClient.on('connect', () => {
  console.log('Redis connect');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

let redisConnectPromise = null;

/** Ленивое подключение: первый вызов к Redis или WebSocket-коллабу. */
export async function ensureRedisConnected() {
  if (redisClient.isOpen) return;
  if (!redisConnectPromise) {
    redisConnectPromise = redisClient.connect().catch((e) => {
      redisConnectPromise = null;
      throw e;
    });
  }
  return redisConnectPromise;
}
