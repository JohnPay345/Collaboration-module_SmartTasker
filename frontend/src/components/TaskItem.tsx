import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextColors, MainColors, ColorStatusTasks } from '@/constants';
import { TaskStatus } from '../types/statuses';

interface TaskItemProps {
  title: string;
  project: string;
  assignment: string;
  priority: number;
  date: string;
  status: TaskStatus;
  onPress?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  title,
  project = 'Вне проекта',
  assignment,
  priority,
  date,
  status = 'Черновик',
  onPress
}) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'В работе':
        return ColorStatusTasks.snowbank;
      case 'Выполнена':
        return ColorStatusTasks.herbery_honey;
      case 'Сдана':
        return ColorStatusTasks.vivid_blue;
      case 'Провален':
        return ColorStatusTasks.raspberry_rave;
      case 'Неактуально':
        return ColorStatusTasks.animal_blood;
      case 'Черновик':
        return ColorStatusTasks.lunar_base;
      default:
        return ColorStatusTasks.lunar_base;
    }
  };
  const getTextColor = (status: TaskStatus) => {
    if (status === 'Выполнена' || status === 'Сдана' || status === 'В работе') {
      return TextColors.dire_wolf;
    }
    return TextColors.snowbank;
  };

  const statusColor = getStatusColor(status);
  const statusTextColor = getTextColor(status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.projectLabel}>{project}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>{assignment}</Text>
            <Text style={styles.priority}>Приоритет: {priority}</Text>
            <View style={[styles.statusContainer, { backgroundColor: statusColor }]}>
              <Text style={[styles.status, { color: statusTextColor }]}>{status}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MainColors.white,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: TextColors.dim_gray,
  },
  content: {
    flexDirection: 'column',
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  projectLabel: {
    fontSize: 12,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  dateText: {
    width: 70,
    textAlign: 'center',
    fontSize: 12,
    color: TextColors.beer,
    fontFamily: 'Century-Regular',
  },
  title: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
    fontFamily: 'Century-Regular',
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    width: 80,
    fontSize: 12,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  priority: {
    fontSize: 12,
    color: TextColors.ottoman_red,
    fontFamily: 'Century-Regular',
  },
  statusContainer: {
    alignSelf: 'flex-end',
    backgroundColor: ColorStatusTasks.snowbank,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 23,
  },
  status: {
    fontSize: 12,
    color: TextColors.black,
    fontFamily: 'Century-Regular',
  },
}); 