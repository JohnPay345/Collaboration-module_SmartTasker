import { RabbitMQ_Config } from '#rmq/rabbitmq_config.js';

const CHAT_EXCHANGE = 'chat';
const ROUTING_KEY = 'chat.deliver';

/**
 * Публикует сообщение чата в RabbitMQ для доставки получателям через WebSocket.
 * @param {{ chatId: string, message: object, recipientUserIds: string[] }} payload
 */
export const publishChatMessage = async (payload) => {
  let channel;
  try {
    const connection = await RabbitMQ_Config.connectRabbitMQ();
    channel = await connection.createChannel();
    await channel.assertExchange(CHAT_EXCHANGE, 'direct', { durable: true });
    const message = Buffer.from(JSON.stringify(payload));
    channel.publish(CHAT_EXCHANGE, ROUTING_KEY, message, { persistent: true });
  } catch (error) {
    console.error('chatPublisher.publishChatMessage:', error);
  } finally {
    if (channel) {
      try {
        await channel.close();
      } catch (e) {
        // ignore
      }
    }
  }
};
