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
import { Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { ProjectItem } from '@src/components/ProjectItem';
import { BurgerMenu } from '@src/components/BurgerMenu';
import { router } from 'expo-router';
import { useProjects } from '@src/context/ProjectsContext';

type ProjectStatus = 'В работе' | 'Выполнена' | 'Сдана' | 'Провален' | 'Неактуально' | 'Приостановлен' | 'Черновик';

interface Project {
  id: number;
  title: string;
  tasksCount: number;
  completedTasks: number;
  deadline: string;
  status: ProjectStatus;
}

export const ProjectsScreen = () => {
  const { projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // MOCK задачи для примера прогресса
  const mockTasks = [
    { task_id: 't1', project_id: '1', status: 'Выполнена' },
    { task_id: 't2', project_id: '1', status: 'В работе' },
    { task_id: 't3', project_id: '1', status: 'Выполнена' },
    { task_id: 't4', project_id: '2', status: 'Выполнена' },
    { task_id: 't5', project_id: '2', status: 'Выполнена' },
    { task_id: 't6', project_id: '2', status: 'В работе' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Проекты</Text>
        <TouchableOpacity onPress={() => router.push("/inbox")}>
          <Ionicons name="notifications-outline" size={30} color={MainColors.pool_water} />
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
          <Ionicons name="options" size={30} color={MainColors.pool_water} />
        </TouchableOpacity>
      </View>

      {projects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MainColors.pool_water} />
          <Text style={styles.loadingText}>Загрузка проектов...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredProjects.map(project => {
            const projectTasks = mockTasks.filter(t => t.project_id === project.project_id);
            const tasksCount = projectTasks.length;
            const completedTasks = projectTasks.filter(t => t.status === 'Выполнена').length;
            return (
              <ProjectItem
                key={project.project_id}
                title={project.project_name}
                tasksCount={tasksCount}
                completedTasks={completedTasks}
                deadline={project.end_date.toLocaleDateString()}
                status={project.status}
                onPress={() => { router.push(`/(projects)/${project.project_id}`) }}
              />
            );
          })}
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
          onPress={() => { router.push('/(projects)/create'); }}
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