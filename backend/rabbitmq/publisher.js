import { webSocketService } from '#root/service/websocket.js';
import { RabbitMQ_Config } from '#rmq/rabbitmq_config.js';
import { NotificationsModel } from "#root/models/notifications.models.js";

const pushQueue = 'notifications.push';

export const publishMessage = async (type, action, message) => {
  try {
    if (message == null || message == "") {
      console.log('Message and queue must be filled!');
      return;
    }
    const userId = message.data.userId;
    const { allowedInAppNotifications, allowedPushNotifications, allowedEvent } = await checkSettingsNotifications(userId, message.data.eventType);
    const saveInAppNotification = await NotificationsModel.saveInAppNotification(message.data);
    if (saveInAppNotification?.type == 'errorMsg') {
      console.error('Failed to save in-app notification to database');
      return;
    }

    const notificationId = saveInAppNotification?.notification_id ?? saveInAppNotification ?? null;

    // In-app (WebSocket) — не должен блокировать push, если пользователь оффлайн
    if (webSocketService.isUserConnected(userId) && allowedInAppNotifications && allowedEvent) {
      const websocketMessage = {
        type: type,
        action: action,
        notification: {
          notification_id: notificationId,
          title: message.data.title,
          body: message.data.body,
          notification_type: message.data.eventType,
          notification_data: message.data.data ?? {},
          is_read: false,
          created_at: new Date().toISOString(),
        },
      };
      webSocketService.sendNotification(userId, websocketMessage);
    }

    if (allowedPushNotifications && allowedEvent) {
      const channel = await RabbitMQ_Config.getChannel();
      await channel.assertQueue(pushQueue, { durable: true });
      const pushPayload = {
        userId,
        title: message.data.title,
        body: message.data.body,
        notificationId,
        data: message.data.data ?? {},
      };
      channel.sendToQueue(pushQueue, Buffer.from(JSON.stringify(pushPayload)));
      console.log(`Sent push to queue for ${userId}`);
    } else {
      console.log(`User ${userId} push disabled for event ${action}`);
    }
  } catch (error) {
    console.error('Error publishing message:', error);
  }
}

const checkSettingsNotifications = async (userId, eventType) => {
  try {
    const getSettingsNotifications = await NotificationsModel.getSettingsNotifications(userId);
    if (getSettingsNotifications.type === 'errorMsg') {
      console.error('Failed to get user notification settings:', getSettingsNotifications.errorMsg);
      return false;
    }
    const allowedInAppNotifications = getSettingsNotifications.result.notifications_settings?.inapp;
    const settingsNotifications = getSettingsNotifications.result;
    const allowedPushNotifications = getSettingsNotifications.result.notifications_settings?.push;
    let allowedEvent = false;
    if (settingsNotifications.notifications_settings_tasks && settingsNotifications.notifications_settings_tasks[eventType]) {
      allowedEvent = true;
    } else if (settingsNotifications.notifications_settings_projects && settingsNotifications.notifications_settings_projects[eventType]) {
      allowedEvent = true;
    } else {
      console.log(`Event type ${eventType} not found in notification_settings for user ${userId}`);
      allowedEvent = false;
    }
    return { allowedInAppNotifications, allowedPushNotifications, allowedEvent };
  } catch (error) {
    console.error('Error checking settings notifications:', error);
    return false;
  }
}
