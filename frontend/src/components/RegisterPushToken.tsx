import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@src/hooks/useAuth';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useRegisterTokens } from '@src/api/notifications';
import { getDeviceType, getPushToken } from '@src/services/pushNotifications';
import { getToken } from '@src/services/tokenStorage';
import { useSegments } from 'expo-router';

const LAST_PUSH_TOKEN_KEY = '@last_push_token';

function getUserIdFromJwt(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

export function RegisterPushToken() {
  const { isAuthenticated, isLoading } = useAuth();
  const userId = useCurrentUserId();
  const registerTokens = useRegisterTokens();
  const segments = useSegments();
  const isAuthRoute = segments[0] === '(auth)';

  useEffect(() => {
    // Не отправляем токен до завершения проверки auth и на auth-экранах.
    if (isLoading || !isAuthenticated || isAuthRoute) return;

    (async () => {
      const accessToken = await getToken();
      const tokenUserId = getUserIdFromJwt(accessToken);
      const effectiveUserId = tokenUserId ?? userId;
      if (!effectiveUserId) return;

      const token = await getPushToken();
      if (!token) return;

      const deviceType = getDeviceType();
      await registerTokens.mutateAsync({ userId: effectiveUserId, deviceToken: token, deviceType });
      await AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, token);
    })().catch((e) => console.error('RegisterPushToken error:', e));
  }, [isAuthenticated, isLoading, isAuthRoute, userId]);

  return null;
}

