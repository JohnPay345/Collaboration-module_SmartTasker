import amqp from 'amqplib';
import { config } from 'dotenv';

config()

let connection = null;
let channel = null;

const isConnectionOpen = () => connection && typeof connection.close === 'function';
const isChannelOpen = () => channel && typeof channel.close === 'function';
export const RabbitMQ_Config = {
  connectRabbitMQ: async () => {
    try {
      if (isConnectionOpen()) return connection;
      if (!process.env.RABBITMQ_URI) {
        throw new Error('RABBITMQ_URI is not set');
      }
      connection = await amqp.connect(process.env.RABBITMQ_URI);
      console.log('Connected to RabbitMQ');

      // Если connection оборвётся — сбрасываем channel/connection.
      connection.on?.('close', () => {
        connection = null;
        channel = null;
      });
      connection.on?.('error', () => {
        connection = null;
        channel = null;
      });
      return connection;
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  },
  createChannel: async () => {
    const conn = await RabbitMQ_Config.connectRabbitMQ();
    channel = await conn.createChannel();
    return channel;
  },
  getChannel: async () => {
    if (isChannelOpen()) return channel;
    return await RabbitMQ_Config.createChannel();
  },
  getConnection: async () => {
    return await RabbitMQ_Config.connectRabbitMQ();
  },
  closeConnection: async () => {
    if (connection) {
      await connection.close();
      console.log('Closed connection to RabbitMQ');
    }
    connection = null;
    channel = null;
  }
};