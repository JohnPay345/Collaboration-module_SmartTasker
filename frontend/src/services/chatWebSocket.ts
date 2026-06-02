import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';

export type IncomingWSMessage = {
  type: string;
  action?: string;
  chatId?: string;
  message?: ChatMessagePayload;
  notification?: NotificationWSMessage;
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

export type NotificationWSMessage = {
  notification_id: string;
  title: string;
  body: string;
  notification_type: string;
  notification_data?: object;
  is_read: boolean;
  created_at: string;
}

const WS_BASE = BASE_URL.replace(/^http/, 'ws');
const USER_DATA_KEY = 'user_data';

let ws: WebSocket | null = null;
const chatSubscribers = new Map<string, Set<(msg: ChatMessagePayload) => void>>();
const notificationSubscribers = new Set<(msg: any) => void>();

function notifyChatSubscribers(chatId: string, message: ChatMessagePayload) {
  const set = chatSubscribers.get(chatId);
  if (!set) return;
  set.forEach((fn) => {
    try {
      fn(message);
    } catch (e) {
      console.error('chat subscriber error', e);
    }
  });
}

function notifyNotificationSubscribers(notification: any) {
  notificationSubscribers.forEach((fn) => {
    try {
      fn(notification);
    } catch (e) {
      console.error('notification subscriber error', e);
    }
  });
}

/** Подписка на новые сообщения чата. Возвращает функцию отписки. */
export function subscribeChatMessages(
  chatId: string,
  handler: (msg: ChatMessagePayload) => void
): () => void {
  if (!chatSubscribers.has(chatId)) chatSubscribers.set(chatId, new Set());
  chatSubscribers.get(chatId)!.add(handler);
  return () => {
    const set = chatSubscribers.get(chatId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) chatSubscribers.delete(chatId);
  };
}

export function subscribeNotifications(handler: (msg: any) => void): () => void {
  notificationSubscribers.add(handler);
  return () => {
    notificationSubscribers.delete(handler);
  };
}

// Получить текущий user_id из AsyncStorage (сохранён при логине)
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.user_id ?? null;
  } catch {
    return null;
  }
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
        if (
          data.type === 'chat' &&
          data.action === 'new_message' &&
          data.chatId &&
          data.message
        ) {
          notifyChatSubscribers(data.chatId, data.message);
        }

        if (data?.notification && typeof data.notification === 'object') {
          notifyNotificationSubscribers(data.notification);
        }
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
