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
    if (saveInAppNotification.type == 'errorMsg') {
      console.error('Failed to save in-app notification to database');
      return;
    }
    if (webSocketService.isUserConnected(userId)) {
      if (allowedInAppNotifications && allowedEvent) {
        const websocketMessage = {
          type: type,
          action: action,
          notification: {
            notificationId: saveInAppNotification.notification_id,
            title: message.data.title,
            body: message.data.body
          }
        };
        webSocketService.sendNotification(userId, websocketMessage);
      } else {
        console.log(`User ${userId} has disabled in-app notifications for event type ${eventType}`);
        return;
      }
    } else {
      console.log(`User ${userId} is not connected or has disabled in-app notifications`);
      return;
    }
    if (allowedPushNotifications && allowedEvent) {
      const channel = RabbitMQ_Config.chanel;
      await channel.assertQueue(pushQueue, { durable: true });
      const notification = {
        type: type,
        action: action,
        userId: userId,
        title: message.data.title,
        body: message.data.body,
        notificationId: saveInAppNotification.notification_id
      };
      channel.sendToQueue(pushQueue, Buffer.from(JSON.stringify(notification)));
      console.log(`Sent message to ${pushQueue}:`, notification);
      await channel.close();
    } else {
      console.log(`User ${userId} has disabled push notifications for event type ${eventType}`);
      return;
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
    const allowedPushNotifications = getSettingsNotifications.result.notifications_settings?.push;
    let allowedEvent = false;
    if (allowedInAppNotifications.notifications_tasks && allowedInAppNotifications.notifications_tasks[eventType] == true) {
      allowedEvent = true;
    } else if (allowedInAppNotifications.notifications_projects && allowedInAppNotifications.notifications_projects[eventType] == true) {
      allowedEvent = true;
    } else {
      console.log(`Event type ${eventType} not found in notification_settings for user ${userId}`);
      allowedEvent = false;
    }
    return { allowedInAppNotifications, allowedEvent };
  } catch (error) {
    console.error('Error checking settings notifications:', error);
    return false;
  }
}
