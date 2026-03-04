import amqp from 'amqplib';
import { config } from 'dotenv';

config()

let connection = null;
let channel = null;
export const RabbitMQ_Config = {
  connectRabbitMQ: async () => {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URI);
      console.log('Connected to RabbitMQ');
      return connection;
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  },
  createChannel: async () => {
    channel = await connection.createChannel();
    return channel;
  },
  closeConnection: async () => {
    if (connection) {
      await connection.close();
      console.log('Closed connection to RabbitMQ');
    }
  }
};