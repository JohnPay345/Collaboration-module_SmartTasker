import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { useNotificationsContext, type ToastItem } from '@src/context/NotificationsContext';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useMarkNotificationRead } from '@src/api/notifications';

const TOAST_DURATION_MS = 4000;

type SingleToastProps = {
  item: ToastItem;
};

function SingleToast({ item }: SingleToastProps) {
  const { dismissToast, markReadLocally } = useNotificationsContext();
  const userId = useCurrentUserId();
  const markRead = useMarkNotificationRead();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    timer.current = setTimeout(() => dismiss(false), TOAST_DURATION_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const dismiss = (readOnTap: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start(() => dismissToast(item.uid));

    if (readOnTap && userId && item.notification_id) {
      markRead.mutate({ userId, notificationId: item.notification_id });
      markReadLocally(item.notification_id);
    }
  };

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.inner}
        onPress={() => dismiss(true)}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={20} color={MainColors.pool_water} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        <TouchableOpacity onPress={() => dismiss(false)} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={TextColors.dim_gray} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Показывает стопку InApp-уведомлений поверх экрана.
 * Размещать в _layout.tsx за пределами навигации.
 */
export function InAppNotificationToast() {
  const { toastQueue } = useNotificationsContext();

  if (!toastQueue.length) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toastQueue.slice(0, 3).map((item) => (
        <SingleToast key={item.uid} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    backgroundColor: MainColors.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: MainColors.pool_water,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconWrap: {
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Century-Regular',
    fontWeight: '700',
    color: TextColors.dire_wolf,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
