import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { BASE_URL, MainColors, TextColors } from '@/constants';
import { router } from 'expo-router';
import { ModalItem } from '@src/components/ModalItem';

type notificationType = {
  id: string,
  user_id: string,
  notification_type: string,
  notification_title: string,
  notification_body: string,
  notification_data: string,
  is_read: boolean,
  created_at: Date,
}

export const InboxScreen = () => {
  const [isShowModalNotification, setIsShowModalNotification] = useState<boolean>(false);
  const [notificationsData, setNotificationsData] = useState<notificationType[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<notificationType | null>(null);

  // Запрос уведомлений пользователя
  useEffect(() => {
    //const inAppNotifications = getInAppNotifications();
    const tempNotifications = [
      {
        id: 1,
        user_id: 23,
        notification_type: 'task.test',
        notification_title: 'Первое уведомление',
        notification_body: 'Тело первого уведомления',
        notification_data: '',
        is_read: false,
        created_at: new Date()
      },
      {
        id: 2,
        user_id: 23,
        notification_type: 'task.test',
        notification_title: 'Второе уведомление',
        notification_body: 'Тело второго уведомления',
        notification_data: '',
        is_read: false,
        created_at: new Date()
      },
      {
        id: 3,
        user_id: 23,
        notification_type: 'task.test',
        notification_title: 'Третье уведомление',
        notification_body: 'Тело третье уведомления',
        notification_data: '',
        is_read: false,
        created_at: new Date()
      },
      {
        id: 4,
        user_id: 23,
        notification_type: 'task.test',
        notification_title: 'Четвёртое уведомление',
        notification_body: 'Тело четвёртого уведомления',
        notification_data: '',
        is_read: false,
        created_at: new Date()
      }
    ];
    setNotificationsData(tempNotifications);
  }, []);

  const getInAppNotifications = async () => {
    const response = await fetch(`${BASE_URL}/notification/in-app`);
    const data = await response.json();
    setNotificationsData(data);
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={handleBack}>
            <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Уведомления</Text>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {/* Список уведомлений */}
        {notificationsData && notificationsData.map((notification: notificationType) => (
          <TouchableOpacity key={notification.id} onPress={() => { setIsShowModalNotification(true); setSelectedNotification(notification) }}>
            <View style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{notification.notification_title}</Text>
              <Text style={styles.notificationBody}>{notification.notification_body}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Модальные окна */}
        <ModalItem
          isVisible={isShowModalNotification}
          onClose={() => { setIsShowModalNotification(false) }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedNotification?.notification_title}</Text>
            <Text style={styles.modalBody}>{selectedNotification?.notification_body}</Text>
          </View>
        </ModalItem>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
  },
  notificationBody: {
    fontSize: 14,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
  },
  modalContent: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
  },
}); 