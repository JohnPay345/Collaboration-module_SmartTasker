import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { TaskItem } from '@src/components/TaskItem';
import { BurgerMenu } from '@src/components/BurgerMenu';
import { router } from 'expo-router';

type TaskStatus = 'В работе' | 'Выполнена' | 'Сдана' | 'Провален' | 'Неактуально' | 'Черновик';

interface Task {
  id: number;
  title: string;
  project: string;
  assignment: string;
  priority: number;
  date: string;
  status: TaskStatus;
}

export const TasksScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    // TODO: Заменить на запрос к API
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTasks([
        {
          id: 1,
          title: 'Задача 1',
          project: 'Проект 1',
          assignment: 'Сотрудник 1',
          priority: 1,
          date: '08.01.2025 18:45',
          status: 'Черновик'
        },
        {
          id: 2,
          title: 'Задача 2',
          project: 'Проект 2',
          assignment: 'Задача самому себе',
          priority: 1,
          date: '18:45',
          status: 'Черновик'
        },
      ]);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Задачи</Text>
        <TouchableOpacity onPress={() => router.push("/inbox")}>
          <Ionicons name="notifications-outline" size={30} color={TextColors.pool_water} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor="#868686"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={30} color={TextColors.pool_water} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MainColors.pool_water} />
          <Text style={styles.loadingText}>Загрузка задач...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              title={task.title}
              project={task.project}
              assignment={task.assignment}
              priority={task.priority}
              date={task.date}
              status={task.status}
              onPress={() => router.push(`/(tasks)/${task.id}`)}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsMenuOpen(true)}
        >
          <Ionicons name="menu" size={35} color={MainColors.pool_water} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(`/(tasks)/create`)}
        >
          <Ionicons name="add" size={35} color={MainColors.pool_water} />
        </TouchableOpacity>
      </View>

      <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
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