import WebSocket from 'ws';
import { log } from './botHelpers.js';
import { MetricsCollector } from './botMetrics.js';

/**
 * Слушатель WebSocket получателя (peer-id) для измерения E2E задержки чата.
 */
export class ChatWsListener {
  /**
   * @param {{ wsBase: string; userId: string; chatId?: string }} opts
   */
  constructor(opts) {
    this.wsBase = opts.wsBase.replace(/\/$/, '');
    this.userId = opts.userId;
    this.chatId = opts.chatId;
    /** @type {WebSocket | null} */
    this.ws = null;
    this.connected = false;
    this.metrics = new MetricsCollector('chat-e2e (WS → получатель)');
    /** @type {Map<string, number>} token → sentAt */
    this.pending = new Map();
  }

  get url() {
    return `${this.wsBase}/ws/${encodeURIComponent(this.userId)}`;
  }

  async connect(timeoutMs = 15000) {
    if (this.connected) return;

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timer = setTimeout(() => {
        ws.terminate();
        reject(new Error(`timeout WS listener ${this.url}`));
      }, timeoutMs);

      ws.on('open', () => {
        this.connected = true;
        clearTimeout(timer);
        log('ws-listener', `подключён ${this.userId}`);
        resolve();
      });

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(String(raw));
          if (data.type !== 'chat' || data.action !== 'new_message' || !data.message) return;
          if (this.chatId && data.chatId !== this.chatId) return;

          const text = data.message.message_text ?? '';
          const token = extractLatencyToken(text);
          if (!token) return;

          const sentAt = this.pending.get(token);
          if (sentAt == null) return;

          const latency = Date.now() - sentAt;
          this.metrics.recordLatency(latency);
          this.metrics.recordEvent();
          this.pending.delete(token);
          log('ws-listener', `E2E ${latency} ms — ${text.slice(0, 60)}`);
        } catch {
          /* ignore */
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

  /** @param {string} token уникальный маркер в тексте сообщения */
  registerPending(token) {
    this.pending.set(token, Date.now());
  }

  /** @param {number} timeoutMs */
  async waitForPending(timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while (this.pending.size > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  finish() {
    this.metrics.finish();
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.connected = false;
  }
}

export function makeLatencyToken() {
  return `lat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** @param {string} text */
export function extractLatencyToken(text) {
  const m = text.match(/\[#(lat-[^\]]+)\]/);
  return m ? m[1] : null;
}

/** @param {string} body @param {string} token */
export function embedLatencyToken(body, token) {
  return `[#${token}] ${body}`;
}
