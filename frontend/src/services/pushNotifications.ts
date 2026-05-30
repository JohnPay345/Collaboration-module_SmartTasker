import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type DeviceType = 'android' | 'ios' | 'web';

export function getDeviceType(): DeviceType {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * Возвращает FCM/APNs native device token (не Expo Push Token).
 * Это тот токен, который нужен Firebase Admin SDK при вызове messaging().send({ token }).
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      return deviceToken.data ?? null;
    }
    return null;
  } catch (e) {
    console.error('getPushToken error:', e);
    return null;
  }
}

/** Настройка обработчика входящих push-уведомлений (foreground) */
export function configurePushNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // показываем своё InApp-toast
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
