import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@src/services/axios';
import { handleApiError } from '@src/services/errors';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  notification_id: string;
  user_id: string;
  notification_type: string;
  notification_title: string;
  notification_body: string;
  notification_data: object;
  is_read: boolean;
  created_at: Date;
}

type ApiEnvelope<T> = {
  code: number;
  url: string;
  message: T;
};

export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Notification[]>>(
        `/api/notifications/inbox/${userId}`
      );
      return data.message ?? [];
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
    enabled: !!userId,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      notificationId,
    }: {
      userId: string;
      notificationId: string;
    }) => {
      const { data } = await api.patch<ApiEnvelope<{ notification_id: string; is_read: boolean }>>(
        `/api/notifications/inbox/${userId}/${notificationId}/read`
      );
      return data.message;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (e) => handleApiError(e),
  });
};

export type DeviceType = 'android' | 'ios' | 'web';

export const useRegisterTokens = () => {
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      deviceToken: string;
      deviceType: DeviceType;
    }) => {
      try {
        const { data } = await api.post(`/api/notifications/register-tokens`, payload);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};
