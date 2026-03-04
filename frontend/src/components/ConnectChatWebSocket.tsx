import { useEffect } from 'react';
import { connectChatWebSocket, disconnectChatWebSocket, getCurrentUserId } from '@src/services/chatWebSocket';
import { useAuth } from '@src/hooks/useAuth';

/**
 * Подключает WebSocket для чата при успешной авторизации (после логина).
 * Размонтирование / логаут — отключает.
 */
export function ConnectChatWebSocket() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectChatWebSocket();
      return;
    }
    getCurrentUserId().then((userId) => {
      if (userId) connectChatWebSocket(userId);
    });
    return () => disconnectChatWebSocket();
  }, [isAuthenticated]);

  return null;
}
