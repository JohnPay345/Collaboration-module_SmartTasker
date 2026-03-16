import { pool } from '#root/service/connection.js';

const MESSAGES_PAGE_SIZE = 50;

export const ChatModel = {
  getOrCreatePrivateChat: async (userId1, userId2) => {
    try {
      const existing = await pool.query(
        `SELECT c.chat_id FROM chats c
         INNER JOIN chat_members m1 ON m1.chat_id = c.chat_id AND m1.user_id = $1
         INNER JOIN chat_members m2 ON m2.chat_id = c.chat_id AND m2.user_id = $2
         WHERE c.chat_type = 'private'`,
        [userId1, userId2]
      );
      if (existing.rows.length > 0) {
        return { type: 'result', result: existing.rows[0] };
      }
      await pool.query('BEGIN');
      const insertChat = await pool.query(
        `INSERT INTO chats (chat_type) VALUES ('private') RETURNING chat_id`
      );
      const chatId = insertChat.rows[0].chat_id;
      await pool.query(
        `INSERT INTO chat_members (user_id, chat_id) VALUES ($1, $3), ($2, $3)`,
        [userId1, userId2, chatId]
      );
      await pool.query('COMMIT');
      return { type: 'result', result: { chat_id: chatId } };
    } catch (e) {
      await pool.query('ROLLBACK').catch(() => {});
      console.error('ChatModel.getOrCreatePrivateChat:', e);
      return { type: 'errorMsg', errorMsg: e.message };
    }
  },

  getMessages: async (chatId, limit = MESSAGES_PAGE_SIZE, offset = 0) => {
    try {
      const result = await pool.query(
        `SELECT chat_messages_id, chat_id, user_id, message_text, message_type, created_at, updated_at
         FROM chat_messages
         WHERE chat_id = $1
         ORDER BY created_at ASC
         LIMIT $2 OFFSET $3`,
        [chatId, limit, offset]
      );
      return { type: 'result', result: result.rows };
    } catch (e) {
      console.error('ChatModel.getMessages:', e);
      return { type: 'errorMsg', errorMsg: e.message };
    }
  },

  addMessage: async (chatId, userId, messageText, messageType = 'text') => {
    try {
      const result = await pool.query(
        `INSERT INTO chat_messages (chat_id, user_id, message_text, message_type)
         VALUES ($1, $2, $3, $4)
         RETURNING chat_messages_id, chat_id, user_id, message_text, message_type, created_at, updated_at`,
        [chatId, userId, messageText, messageType]
      );
      return { type: 'result', result: result.rows[0] };
    } catch (e) {
      console.error('ChatModel.addMessage:', e);
      return { type: 'errorMsg', errorMsg: e.message };
    }
  },

  getChatMemberUserIds: async (chatId) => {
    try {
      const result = await pool.query(
        `SELECT user_id FROM chat_members WHERE chat_id = $1`,
        [chatId]
      );
      return { type: 'result', result: result.rows.map((r) => r.user_id) };
    } catch (e) {
      console.error('ChatModel.getChatMemberUserIds:', e);
      return { type: 'errorMsg', errorMsg: e.message };
    }
  },

  isMember: async (chatId, userId) => {
    try {
      const result = await pool.query(
        `SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2`,
        [chatId, userId]
      );
      return { type: 'result', result: result.rows.length > 0 };
    } catch (e) {
      console.error('ChatModel.isMember:', e);
      return { type: 'errorMsg', errorMsg: e.message };
    }
  },
};
