import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';

export const webSocketService = {
  wss: null,
  connectedUsers: new Map(),
  setupWebsocketServer: (server) => {
    webSocketService.wss = new WebSocketServer({ server: server, path: '/ws' });
    webSocketService.wss.on('connection', (ws, req) => {
      const userId = req.url.substring(req.url.lastIndexOf('/') + 1);
      console.log(userId);
      if (!userId) {
        console.warn('Websocket connection without user ID.');
        ws.close();
        return;
      }
      webSocketService.connectedUsers.set(userId, ws);
      console.log(`Client connected: ${userId}`);
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
        console.log(`Sent to user ${userId}:`, notification);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.log(`User ${userId} not connected or WebSocket not open.`);
    }
  }
}
