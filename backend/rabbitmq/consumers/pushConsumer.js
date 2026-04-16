import { config } from 'dotenv';
import admin from 'firebase-admin';
import { RabbitMQ_Config } from '#rmq/rabbitmq_config.js';

config();

const pushQueue = 'notifications.push';
let firebaseInited = false;

const processPushNotification = async (msg, channel) => {
  if (!msg) {
    console.log('No message received');
    return;
  }
  try {
    const notificationData = JSON.parse(msg.content.toString());
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    console.log('Received push notification:', notificationData);
    if (!firebaseInited) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInited = true;
    }
    const { userId, title, body, notificationId } = notificationData;
    const payload = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        notificationId: notificationId.toString(),
      },
    };
    const response = await admin.messaging().send(userId, payload);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error processing push notification:', error);
    if (error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered') {
      console.warn(`FCM token invalid or not registered. Removing from database.`);
      // TODO: Удаление недействительного токена из базы данных
    } else if (error.code === 'messaging/quota-exceeded') {
      console.error('FCM quota exceeded. Implement retry logic or reduce sending rate.');
    } else if (error.code === 'messaging/invalid-payload') {
      console.error('Invalid payload. Check your message format.');
    }
  } finally {
    if (msg) channel.ack(msg);
  }
}

export const pushConsumer = {
  startPushConsumer: async () => {
    try {
      const channel = await RabbitMQ_Config.getChannel();
      await channel.assertQueue(pushQueue, { durable: true });
      channel.consume(pushQueue, (msg) => processPushNotification(msg, channel));
      console.log('Waiting for push notifications...');
    } catch (error) {
      console.error('Error starting push consumer:', error);
    }
  },
};