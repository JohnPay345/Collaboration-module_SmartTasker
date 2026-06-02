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
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useProjects as useProjectsApi, type Project } from '@src/api/projects';
import { useTasks } from '@src/api/tasks';
import { Header } from '@src/components/Header'
import { Footer } from '@src/components/Footer'
import { FailedLoadContent } from '@src/components/FailedLoadContent'

export const ProjectsScreen = () => {
  const userId = useCurrentUserId();
  const { data: projectsData, isLoading: projectsLoading } = useProjectsApi(userId ?? '');
  const { data: tasks = [] } = useTasks({ user_id: userId ?? '' });

  const projects = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.data ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header titleScreen={"Проекты"} />

      {projectsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MainColors.pool_water} />
          <Text style={styles.loadingText}>Загрузка проектов...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredProjects.length ? filteredProjects.map(project => {
            const projectTasks = tasks.filter((t) => t.project_id === project.project_id);
            const tasksCount = projectTasks.length;
            const completedTasks = projectTasks.filter(t => t.status === 'Выполнена').length;
            const deadline = project.end_date ? new Date(project.end_date).toLocaleDateString('ru-RU') : '';
            return (
              <ProjectItem
                key={project.project_id}
                title={project.project_name}
                tasksCount={tasksCount}
                completedTasks={completedTasks}
                deadline={deadline}
                status={project.status}
                onPress={() => {
                  router.push(`/(projects)/${project.project_id}`)
                }}
              />
            )}
          ) :  <FailedLoadContent text={"Проектов нет или же вас не пригласили"} />}
        </ScrollView>
      )}

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
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
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