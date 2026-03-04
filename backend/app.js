import Fastify from 'fastify';
import { config } from "dotenv";
import path from "path";
import { routes } from "#routes/index.js";
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { __dirname } from '#root/utils/dirname.js';
import { webSocketService } from '#root/service/websocket.js';
import { pushConsumer } from '#rmq/consumers/pushConsumer.js';
import { chatConsumer } from '#rmq/consumers/chatConsumer.js';
import { createResources } from '#rmq/resourceCreator.js';

config();

const port = process.env.PORT || 8080;
const host = process.env.HOST || 'localhost';
const fastify = Fastify({
  logger: {
    transport: {
      level: "info",
      target: "pino-pretty",
      options: {
        colorize: true,
        customColors: "error:bgRedBright,info:bgGreenBright"
      }
    },
  },
});

// Регистрация кодировки multipart/form-data
fastify.register(fastifyMultipart);

// Регистрация пути к статическим файлам из сервера
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads'
});

// Регистрируем все api пути
fastify.register(routes);

// Создание подключения брокера сообщений
createResources()
  .then(() => {
    pushConsumer.startPushConsumer();
    chatConsumer.startChatConsumer();
  })
  .catch((err) => console.log(err));


// Настройка веб-сокета сервера
webSocketService.setupWebsocketServer(fastify.server);

fastify.listen({ port, host }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`)
});