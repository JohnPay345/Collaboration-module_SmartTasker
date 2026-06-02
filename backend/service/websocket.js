import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import { handleYjsConnection } from '#root/service/yjsCollabRooms.js';

export const webSocketService = {
  wss: null,
  connectedUsers: new Map(),
  setupWebsocketServer: (server) => {
    webSocketService.wss = new WebSocketServer({ server: server });

    webSocketService.wss.shouldHandle = function (req) {
      const pathname = (req.url || '').split('?')[0];
      return pathname === '/ws' || pathname.startsWith('/ws/');
    };

    webSocketService.wss.on('connection', (ws, req) => {
      const pathname = (req.url || '').split('?')[0];

      if (pathname.startsWith('/ws/yjs/')) {
        handleYjsConnection(ws, req).catch((err) => {
          console.error('Yjs websocket handler error:', err);
          try {
            ws.close();
          } catch {
            /* ignore */
          }
        });
        return;
      }

      const segments = pathname.split('/').filter(Boolean);
      const userId = segments.length >= 2 ? segments[1] : null;

      if (!userId) {
        console.warn('Websocket connection without user ID:', pathname);
        ws.close();
        return;
      }

      webSocketService.connectedUsers.set(userId, ws);
      console.log(`Client connected: ${userId} (${pathname})`);
      ws.on('close', () => {
        console.log(`Client disconnected: ${userId}`);
        webSocketService.connectedUsers.delete(userId);
      });
      ws.on('error', (error) => {
        console.error(`Websocket error for ${userId}:`, error);
        webSocketService.connectedUsers.delete(userId);
      });
    });
  },
  isUserConnected: (userId) => {
    return webSocketService.connectedUsers.has(userId);
  },
  sendNotification: (userId, notification) => {
    const ws = webSocketService.connectedUsers.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(notification));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.log(`User ${userId} not connected or WebSocket not open.`);
    }
  }
}
