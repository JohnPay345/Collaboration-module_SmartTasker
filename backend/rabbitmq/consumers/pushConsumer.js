import { config } from 'dotenv';
import admin from 'firebase-admin';
import { RabbitMQ_Config } from '#rmq/rabbitmq_config.js';
import { NotificationsModel } from '#root/models/notifications.models.js';
import pushSmartTasker from '#root/push-smarttasker.json' with { type: 'json' };

config();

const pushQueue = 'notifications.push';
let firebaseInited = false;

function initFirebase() {
  if (firebaseInited) return;
  const serviceAccount = typeof pushSmartTasker === 'string'
    ? JSON.parse(pushSmartTasker)
    : pushSmartTasker;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firebaseInited = true;
}

const processPushNotification = async (msg, channel) => {
  if (!msg) return;
  try {
    const notificationData = JSON.parse(msg.content.toString());
    const { userId, title, body, notificationId, data = {} } = notificationData;

    if (!userId || !title) {
      console.warn('pushConsumer: missing userId or title, skipping');
      channel.ack(msg);
      return;
    }

    const tokenResult = await NotificationsModel.getTokenDevice(userId);
    if (tokenResult.type === 'errorMsg' || !tokenResult.result?.device_token) {
      console.warn(`pushConsumer: no FCM token for user ${userId}`);
      channel.ack(msg);
      return;
    }
    const fcmToken = tokenResult.result.device_token;

    initFirebase();

    const message = {
      token: fcmToken,
      notification: {
        title,
        body: body ?? '',
      },
      data: {
        notificationId: String(notificationId ?? ''),
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: {
          aps: { sound: 'default' },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`FCM sent to ${userId}:`, response);
  } catch (error) {
    console.error('pushConsumer error:', error);
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.warn('FCM token invalid — consider removing from DB');
      // TODO: удалить устаревший токен из user_devices
    }
  } finally {
    channel.ack(msg);
  }
};

export const pushConsumer = {
  startPushConsumer: async () => {
    try {
      const channel = await RabbitMQ_Config.getChannel();
      await channel.assertQueue(pushQueue, { durable: true });
      channel.consume(pushQueue, (msg) => processPushNotification(msg, channel));
      console.log('pushConsumer: waiting for push notifications...');
    } catch (error) {
      console.error('pushConsumer start error:', error);
    }
  },
};
