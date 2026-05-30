import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MainColors, TextColors } from '@/constants';
import { TaskItem } from '@src/components/TaskItem';
import { router } from 'expo-router';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useTasks, type Task } from '@src/api/tasks';
import { useProjects } from '@src/api/projects';
import { Header } from '@src/components/Header'
import { Footer } from '@src/components/Footer'
import { FailedLoadContent } from '../components/FailedLoadContent';
import { LoadingContent } from '@src/components/LoadingContent'

export const TasksScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userId = useCurrentUserId();
  const { data: tasks = [], isLoading } = useTasks({ user_id: userId ?? '' });
  const { data: projectsData } = useProjects(userId ?? '');
  const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.data ?? [];
  const projectNameById = new Map<string, string>(projectsList.map((p: any) => [p.project_id, p.project_name]));

  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (t.task_name ?? '').toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      <Header titleScreen={"Задача"} />

      {isLoading ? (
        <LoadingContent loadingText={'Загрузка задач...'} />
      ) : filteredTasks.length ? (
        <ScrollView style={styles.content}>
          {filteredTasks.map((task: Task) => {
            const projectTitle = task.project_id ? (projectNameById.get(task.project_id) ?? 'Проект') : 'Вне проекта';
            const date = task.updated_at
              ? new Date(task.updated_at).toLocaleString('ru-RU')
              : (task.created_at ? new Date(task.created_at).toLocaleString('ru-RU') : '');
            return (
            <TaskItem
              key={task.task_id}
              title={task.task_name}
              project={projectTitle}
              assignment={task.author_id ? `Автор: ${task.author_name}` : ''}
              priority={Number(task.priority ?? 0)}
              date={date}
              status={task.status}
              onPress={() => router.push(`/(tasks)/${task.task_id}`)}
            />
            );
          })}
        </ScrollView>
      ) : <FailedLoadContent text={"Задач нет или же вам не поручили их"} /> }

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: MainColors.white,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInputContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MainColors.snowbank,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    color: '#868686',
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: MainColors.pool_water,
    borderRadius: 50,
  },
});