import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@src/services/axios';
import { handleApiError } from '@src/services/errors';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  notification_id: string;
  user_id: string;
  notification_type: string,
  notification_title: string;
  notification_body: string;
  notification_data: Object;
  is_read: boolean;
  created_at: Date;
}

export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>(`/notifications/inbox/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useRegisterTokens = (dataTokens: { user_id: string, device_token: string, device_type: string }) => {
  return useQuery({
    queryKey: ['notifications_settings', dataTokens.user_id],
    queryFn: async () => {
      try {
        const { data } = await api.post<Notification[]>(`/notifications/register-tokens`, dataTokens);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
}
