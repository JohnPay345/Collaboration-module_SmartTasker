import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { MainColors, TextColors } from '@/constants';
import { router } from 'expo-router';
import { useProjectTasks } from '@src/api/tasks';
import { ProjectTaskListItem } from '@src/components/ProjectTaskListItem';
import { LoadingContent } from '@src/components/LoadingContent';

interface ProjectTasksTabProps {
  projectId: string;
  userId: string;
}

function formatDeadline(endDate: Date | string | undefined): string {
  if (!endDate) return '—';
  const d = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU');
}

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ projectId, userId }) => {
  const { data: tasks = [], isLoading } = useProjectTasks({ user_id: userId, project_id: projectId });

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const ta = a.end_date ? new Date(a.end_date).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.end_date ? new Date(b.end_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      }),
    [tasks]
  );

  if (isLoading) {
    return <LoadingContent loadingText="Загрузка задач..." />;
  }

  if (!sorted.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>В этом проекте пока нет задач</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {sorted.map((task) => (
        <ProjectTaskListItem
          key={task.task_id}
          title={task.task_name}
          description={task.description}
          deadline={formatDeadline(task.end_date)}
          onPress={() => router.push(`/(tasks)/${task.task_id}`)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: MainColors.white,
  },
  emptyText: {
    fontSize: 15,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
    textAlign: 'center',
  },
});
