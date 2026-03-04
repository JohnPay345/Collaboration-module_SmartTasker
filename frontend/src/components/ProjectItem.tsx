import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextColors, MainColors, ColorStatusProjects } from '@/constants';
import { ProjectStatus } from '@src/types/statuses';

interface ProjectItemProps {
  title: string;
  tasksCount: number;
  completedTasks: number;
  deadline: string;
  status: ProjectStatus;
  onPress?: () => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  title,
  tasksCount,
  completedTasks,
  deadline,
  status,
  onPress
}) => {
  const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'В работе':
        return ColorStatusProjects.herbery_honey;
      case 'Выполнена':
        return ColorStatusProjects.flickery_crt_green;
      case 'Неактуально':
        return ColorStatusProjects.raspberry_rave;
      case 'Сдана':
        return ColorStatusProjects.vivid_blue;
      case 'Провален':
        return ColorStatusProjects.black;
      case 'Приостановлен':
        return ColorStatusProjects.animal_blood;
      case 'Черновик':
        return ColorStatusProjects.snowbank;
      default:
        return ColorStatusProjects.lunar_base;
    }
  };

  const getProgressColor = () => {
    return MainColors.pool_water;
  };

  const getTextColor = (status: ProjectStatus) => {
    if (status === 'Выполнена' || status === 'Сдана' || status === 'В работе') {
      return TextColors.dire_wolf;
    }
    return TextColors.snowbank;
  };

  const statusColor = getStatusColor(status);
  const progressColor = getProgressColor();
  const statusTextColor = getTextColor(status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.dateText}>{deadline}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: progressColor
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.tasksCount}>Задач: {completedTasks}/{tasksCount}</Text>
            <View style={[styles.statusContainer, { backgroundColor: statusColor }]}>
              <Text style={[styles.status, { color: statusTextColor }]}>
                {status}
              </Text>
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    width: '70%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: TextColors.dire_wolf,
    marginBottom: 4,
    fontFamily: 'Century-Regular',
  },
  dateText: {
    width: 70,
    textAlign: 'center',
    fontSize: 12,
    color: '#ea811a',
    fontFamily: 'Century-Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: MainColors.snowbank,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: TextColors.dim_gray,
    fontFamily: 'Century-Regular',
    width: 35,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  tasksCount: {
    fontSize: 12,
    color: TextColors.dim_gray,
    fontFamily: 'Century-Regular',
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 23,
  },
  status: {
    fontSize: 12,
    fontFamily: 'Century-Regular',
  },
}); 