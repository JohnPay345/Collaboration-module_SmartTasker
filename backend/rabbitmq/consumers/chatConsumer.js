import { RabbitMQ_Config } from '#rmq/rabbitmq_config.js';
import { webSocketService } from '#root/service/websocket.js';

const CHAT_QUEUE = 'chat.deliver';

const processChatMessage = async (msg) => {
  if (!msg) return;
  let payload;
  try {
    payload = JSON.parse(msg.content.toString());
  } catch (e) {
    console.error('chatConsumer: invalid JSON', e);
    return;
  }
  const { chatId, message, recipientUserIds } = payload;
  if (!recipientUserIds || !Array.isArray(recipientUserIds) || !message) {
    return;
  }
  const wsPayload = {
    type: 'chat',
    action: 'new_message',
    chatId,
    message,
  };
  for (const userId of recipientUserIds) {
    webSocketService.sendNotification(userId, wsPayload);
  }
};

export const chatConsumer = {
  startChatConsumer: async () => {
    try {
      const connection = await RabbitMQ_Config.connectRabbitMQ();
      const channel = await connection.createChannel();
      await channel.assertQueue(CHAT_QUEUE, { durable: true });
      channel.consume(CHAT_QUEUE, async (msg) => {
        await processChatMessage(msg);
        if (msg) channel.ack(msg);
      });
      console.log('Chat consumer waiting for messages...');
    } catch (error) {
      console.error('Error starting chat consumer:', error);
    }
  },
};
