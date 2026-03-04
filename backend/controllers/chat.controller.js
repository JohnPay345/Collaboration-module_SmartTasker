import { ChatModel } from '#models/chat.model.js';
import { errorReplyCodes, replyResult } from '#root/service/duplicatePartsCode.js';
import { publishChatMessage } from '#rmq/chatPublisher.js';

export const ChatController = {
  /** GET /api/chats/:userId/with/:peerId — получить или создать чат с коллегой */
  getOrCreateChat: async (req, rep) => {
    const { userId, peerId } = req.params;
    const reqUserId = req.user?.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403('DEFAULT', `No access for user ${userId}`, req, rep);
    }
    try {
      const result = await ChatModel.getOrCreatePrivateChat(userId, peerId);
      return replyResult(result, req, rep);
    } catch (e) {
      console.error('getOrCreateChat', e);
      return errorReplyCodes.reply500('DEFAULT', '', req, rep);
    }
  },

  /** GET /api/chats/:userId/:chatId/messages?limit=50&offset=0 */
  getMessages: async (req, rep) => {
    const { userId, chatId } = req.params;
    const reqUserId = req.user?.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403('DEFAULT', `No access for user ${userId}`, req, rep);
    }
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const offset = Number(req.query.offset) || 0;
    try {
      const member = await ChatModel.isMember(chatId, userId);
      if (member.type === 'errorMsg' || !member.result) {
        return errorReplyCodes.reply403('DEFAULT', 'Not a member of this chat', req, rep);
      }
      const result = await ChatModel.getMessages(chatId, limit, offset);
      return replyResult(result, req, rep);
    } catch (e) {
      console.error('getMessages', e);
      return errorReplyCodes.reply500('DEFAULT', '', req, rep);
    }
  },

  /** POST /api/chats/:userId/:chatId/messages — отправить сообщение */
  sendMessage: async (req, rep) => {
    const { userId, chatId } = req.params;
    const reqUserId = req.user?.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403('DEFAULT', `No access for user ${userId}`, req, rep);
    }
    const body = req.body?.data || req.body;
    const messageText = body?.message_text ?? body?.messageText ?? '';
    if (!messageText || typeof messageText !== 'string') {
      return errorReplyCodes.reply400('MISSING_REQUIRED_FIELD', 'message_text required', req, rep);
    }
    try {
      const member = await ChatModel.isMember(chatId, userId);
      if (member.type === 'errorMsg' || !member.result) {
        return errorReplyCodes.reply403('DEFAULT', 'Not a member of this chat', req, rep);
      }
      const addResult = await ChatModel.addMessage(chatId, userId, messageText.trim());
      if (addResult.type === 'errorMsg') {
        return rep.code(400).send({ code: 400, url: req.url, message: addResult.errorMsg });
      }
      const message = addResult.result;
      const membersResult = await ChatModel.getChatMemberUserIds(chatId);
      if (membersResult.type === 'result') {
        const recipientUserIds = membersResult.result.filter((id) => id !== userId);
        await publishChatMessage({ chatId, message, recipientUserIds });
      }
      return replyResult(addResult, req, rep);
    } catch (e) {
      console.error('sendMessage', e);
      return errorReplyCodes.reply500('DEFAULT', '', req, rep);
    }
  },
};
