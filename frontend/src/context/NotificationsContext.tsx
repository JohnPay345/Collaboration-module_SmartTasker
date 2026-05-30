/**
 * NotificationsContext
 *
 * Хранит:
 *   - inboxNotifications — список всех уведомлений (для ящика)
 *   - toastQueue — очередь InApp-уведомлений для показа
 *
 * Подписывается на WS-сообщения типа "notification" через chatWebSocket.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BASE_URL } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Notification } from '@src/api/notifications';

const WS_BASE = BASE_URL.replace(/^http/, 'ws');
const USER_DATA_KEY = 'user_data';

/** Уведомление, пришедшее по WS (поля из publisher.js) */
export type WsNotification = {
  notification_id: string;
  title: string;
  body: string;
  notification_type: string;
  notification_data: object;
  is_read: boolean;
  created_at: string;
};

export type ToastItem = WsNotification & { uid: string };

type NotificationsCtx = {
  /** Полный список для ящика (смешивает HTTP + WS) */
  inboxNotifications: Notification[];
  /** Добавить уведомления из HTTP-запроса (InboxScreen) */
  setInboxFromApi: (items: Notification[]) => void;
  /** Пометить прочитанным локально */
  markReadLocally: (notificationId: string) => void;
  /** Добавить WS-уведомление в inbox */
  addFromWs: (n: WsNotification) => void;
  /** Текущая очередь toast (первый показывается) */
  toastQueue: ToastItem[];
  /** Убрать верхний toast (после показа / нажатия) */
  dismissToast: (uid: string) => void;
};

const NotificationsContext = createContext<NotificationsCtx | undefined>(undefined);

export function useNotificationsContext(): NotificationsCtx {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider');
  return ctx;
}

async function getUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.message?.user_id ?? parsed?.user_id ?? null;
  } catch {
    return null;
  }
}

function toInboxItem(n: WsNotification): Notification {
  return {
    notification_id: n.notification_id,
    user_id: '',
    notification_type: n.notification_type,
    notification_title: n.title,
    notification_body: n.body,
    notification_data: n.notification_data ?? {},
    is_read: n.is_read,
    created_at: new Date(n.created_at),
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [inboxNotifications, setInboxNotifications] = useState<Notification[]>([]);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addFromWs = useCallback((n: WsNotification) => {
    const uid = `${n.notification_id}_${Date.now()}`;
    // Добавить в inbox
    setInboxNotifications((prev) => {
      if (prev.some((x) => x.notification_id === n.notification_id)) return prev;
      return [toInboxItem(n), ...prev];
    });
    // Поставить в очередь toast
    setToastQueue((prev) => [...prev, { ...n, uid }]);
  }, []);

  const dismissToast = useCallback((uid: string) => {
    setToastQueue((prev) => prev.filter((t) => t.uid !== uid));
  }, []);

  const setInboxFromApi = useCallback((items: Notification[]) => {
    setInboxNotifications(items);
  }, []);

  const markReadLocally = useCallback((notificationId: string) => {
    setInboxNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    );
  }, []);

  // WebSocket подписка
  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      const userId = await getUserId();
      if (!userId || !mounted) return;

      // Уже есть открытый WS (из chatWebSocket.ts) — слушаем его через дублирующую подписку.
      // Если нет — устанавливаем собственное WS-соединение.
      const url = `${WS_BASE}/ws/${userId}`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            // Формат из publisher.js: { type, action, notification: WsNotification }
            if (data?.notification && typeof data.notification === 'object') {
              const n = data.notification as WsNotification;
              if (n.notification_id && n.title) {
                addFromWs(n);
              }
            }
          } catch {
            // нотификации всегда JSON, ignore binary
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (mounted) {
            reconnectTimer.current = setTimeout(connect, 4000);
          }
        };

        ws.onerror = () => {
          wsRef.current?.close();
          wsRef.current = null;
        };
      } catch (e) {
        console.error('NotificationsContext WS error:', e);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [addFromWs]);

  return (
    <NotificationsContext.Provider
      value={{
        inboxNotifications,
        setInboxFromApi,
        markReadLocally,
        addFromWs,
        toastQueue,
        dismissToast,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
