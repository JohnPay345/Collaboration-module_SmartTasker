import { ChatController } from '#controllers/chat.controller.js';
import { authenticateToken } from '#root/middleware/authentication.js';

export const ChatRoutes = (fastify, options, done) => {
  fastify.get('/chats/:userId/with/:peerId', { preHandler: authenticateToken }, ChatController.getOrCreateChat);
  fastify.get('/chats/:userId/:chatId/messages', { preHandler: authenticateToken }, ChatController.getMessages);
  fastify.post('/chats/:userId/:chatId/messages', { preHandler: authenticateToken }, ChatController.sendMessage);
  done();
};
