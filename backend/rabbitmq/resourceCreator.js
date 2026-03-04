import { RabbitMQ_Settings } from "#rmq/rabbitmq_constants.js";
import { RabbitMQ_Config } from "#rmq/rabbitmq_config.js";
import { config } from "dotenv";

config();

export const createResources = async () => {
  const connection = await RabbitMQ_Config.connectRabbitMQ();
  const channel = await RabbitMQ_Config.createChannel();
  try {
    for (const exchange of RabbitMQ_Settings.exchanges) {
      await channel.assertExchange(exchange.name, exchange.type, { durable: exchange.durable });
      console.log(`Exchange "${exchange.name}" created`);
    }

    for (const queue of RabbitMQ_Settings.queues) {
      await channel.assertQueue(queue.name, { durable: queue.durable });
      console.log(`Queue "${queue.name}" created`);
    }

    for (const binding of RabbitMQ_Settings.bindings) {
      await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
      console.log(`Binding queue "${binding.queue}" to exchange "${binding.exchange}" with routing key "${binding.routingKey}" created`);
    }

  } catch (error) {
    console.error('Error creating resources:', error);
  }
}
