import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { router } from 'expo-router';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useNotifications, useMarkNotificationRead } from '@src/api/notifications';
import { useNotificationsContext } from '@src/context/NotificationsContext';
import { HeaderEditor } from '@src/components/HeaderEditor';

export const InboxScreen = () => {
  const userId = useCurrentUserId();
  const { data: apiNotifications = [], isLoading, isError } = useNotifications(userId ?? '');
  const { inboxNotifications, setInboxFromApi, markReadLocally } = useNotificationsContext();
  const markRead = useMarkNotificationRead();

  // Синхронизируем HTTP данные в контекст
  useEffect(() => {
    if (apiNotifications.length) setInboxFromApi(apiNotifications);
  }, [apiNotifications]);

  // Сортируем по дате (контекст смешивает WS + HTTP)
  const sorted = [...inboxNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleReadNotification = (notificationId: string) => {
    if (!userId) return;
    markReadLocally(notificationId);
    markRead.mutate({ userId, notificationId });
  };

  return (
    <View style={styles.container}>
      <HeaderEditor
        title="Уведомления"
        onSave={() => router.back()}
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content}>
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={MainColors.pool_water} />
            <Text style={styles.loadingText}>Загрузка уведомлений...</Text>
          </View>
        )}

        {!isLoading && isError && (
          <Text style={styles.errorText}>Не удалось загрузить уведомления</Text>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <Text style={styles.emptyText}>Уведомлений пока нет</Text>
        )}

        {!isLoading &&
          !isError &&
          sorted.map((notification) => {
            const unread = !notification.is_read;
            return (
              <TouchableOpacity
                key={notification.notification_id}
                activeOpacity={0.85}
                onPress={() => {
                  if (unread) handleReadNotification(notification.notification_id);
                }}
              >
                <View style={[styles.notificationItem, unread && styles.notificationUnread]}>
                  <View style={styles.notificationHeader}>
                    <Text
                      style={[styles.notificationTitle, unread && styles.notificationTitleUnread]}
                      numberOfLines={1}
                    >
                      {notification.notification_title}
                    </Text>
                    <View style={styles.metaRow}>
                      {unread && <View style={styles.unreadDot} />}
                      <Text style={styles.dateText}>
                        {new Date(notification.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.notificationBody} numberOfLines={3}>
                    {notification.notification_body}
                  </Text>
                  {unread && (
                    <View style={styles.readHint}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={MainColors.pool_water} />
                      <Text style={styles.readHintText}>Нажмите, чтобы отметить прочитанным</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
  },
  errorText: {
    color: TextColors.ottoman_red,
    fontSize: 14,
    fontFamily: 'Century-Regular',
    marginTop: 8,
  },
  emptyText: {
    color: TextColors.dim_gray,
    fontSize: 14,
    fontFamily: 'Century-Regular',
    marginTop: 16,
    textAlign: 'center',
  },
  notificationItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: MainColors.white,
  },
  notificationUnread: {
    borderColor: MainColors.pool_water,
    backgroundColor: '#f0f8ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginRight: 8,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MainColors.pool_water,
  },
  dateText: {
    fontSize: 12,
    color: TextColors.dim_gray,
    fontFamily: 'Century-Regular',
  },
  notificationBody: {
    fontSize: 13,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
    lineHeight: 18,
  },
  readHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  readHintText: {
    fontSize: 11,
    color: MainColors.pool_water,
    fontFamily: 'Century-Regular',
  },
});
