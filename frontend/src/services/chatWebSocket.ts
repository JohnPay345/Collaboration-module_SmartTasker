import { Subject, Observable, filter, map } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';

export type IncomingWSMessage = {
  type: string;
  action?: string;
  chatId?: string;
  message?: ChatMessagePayload;
  notification?: unknown;
};

export type ChatMessagePayload = {
  chat_messages_id: string;
  chat_id: string;
  user_id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  updated_at: string;
};

const WS_BASE = BASE_URL.replace(/^http/, 'ws');
const USER_DATA_KEY = 'user_data';

let ws: WebSocket | null = null;
const messageSubject = new Subject<IncomingWSMessage>();

// Получить текущий user_id из AsyncStorage (сохранён при логине)
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.message?.user_id ?? data?.user_id ?? null;
  } catch {
    return null;
  }
}

// Поток входящих сообщений с сервера (все типы: chat, notifications и т.д.)
export function getWebSocketMessages(): Observable<IncomingWSMessage> {
  return messageSubject.asObservable();
}

// Только сообщения чата по конкретному chatId (для подписки в экране чата)
export function getChatMessagesStream(chatId: string): Observable<ChatMessagePayload> {
  return messageSubject.pipe(
    filter(
      (msg): msg is IncomingWSMessage & { message: ChatMessagePayload } =>
        msg.type === 'chat' && msg.action === 'new_message' && msg.chatId === chatId && !!msg.message
    ),
    map((msg) => msg.message)
  );
}

// Подключиться к WebSocket после логина (вызывать при наличии userId)
export function connectChatWebSocket(userId: string): void {
  if (typeof userId !== 'string' || !userId) return;
  const url = `${WS_BASE}/ws/${userId}`;
  if (ws?.readyState === WebSocket.OPEN) {
    return;
  }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as IncomingWSMessage;
        messageSubject.next(data);
      } catch {
        // ignore non-JSON
      }
    };
    ws.onclose = () => {
      ws = null;
    };
    ws.onerror = () => {
      ws = null;
    };
  } catch (e) {
    console.error('WebSocket connect error:', e);
    ws = null;
  }
}

/** Отключить WebSocket (при логауте) */
export function disconnectChatWebSocket(): void {
  if (ws) {
    ws.close();
    ws = null;
  }
}
