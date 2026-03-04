import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { MainColors, TextColors } from '@/constants';
import { router, useLocalSearchParams } from 'expo-router';
import { HeaderEditor } from '@src/components/HeaderEditor';
import { Ionicons } from '@expo/vector-icons';
import { ProjectInfoTab } from '@src/tabs/projects/ProjectInfoTab';
import { ProjectTasksTab } from '@src/tabs/projects/ProjectTasksTab';
import { ProjectGoalsTab } from '@src/tabs/projects/ProjectGoalsTab';
import { TabsComponent, Tab } from '@src/components/TabsComponent';
import { useProject, useUpdateProject, useDeleteProject, Project } from '@src/api/projects';
import { useTasks } from '@src/api/tasks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@src/schemas/project.schema';
import { ProjectStatus } from '@src/types/statuses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProjects } from '@src/context/ProjectsContext';

type ProjectMode = 'create' | 'view' | 'edit';

export const ProjectScreen = () => {
  const { project_id } = useLocalSearchParams<{ project_id: string }>();
  const { projects, updateProject, addProject } = useProjects();
  const isCreateMode = !project_id;
  const project = projects.find(p => p.project_id === project_id);
  const isEditable = true;

  const { handleSubmit, formState: { errors }, setValue, watch } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project && !isCreateMode ? {
      project_name: project.project_name,
      description: project.project_description || '',
      status: project.status as ProjectStatus,
      start_date: project.start_date,
      end_date: project.end_date,
      author_id: project.author_id,
      tags: project.tags || [],
    } : {
      project_name: '',
      description: '',
      status: 'В работе',
      start_date: new Date(),
      end_date: new Date(),
      author_id: '',
      tags: [],
    }
  });

  const handleBack = () => {
    router.back();
  };

  const handleSave = (data: ProjectFormData) => {
    if (isCreateMode) {
      addProject({
        ...data,
        project_description: data.description,
        tags: data.tags || [],
        project_goal_id: '',
        goal_name: '',
        goal_description: '',
        target_date: new Date(),
        goal_status: 'В работе',
        project_assignment_id: '',
        user_id: '',
      });
    } else if (project) {
      updateProject({
        ...project,
        ...data,
        project_description: data.description,
        updated_at: new Date(),
      });
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={'Проекты'}
        onBack={handleBack}
        onSave={handleSave}
      />
      <View style={styles.content}>
        <TabsComponent
          activeTab={0}
          onTabChange={(index) => { }}
        >
          <Tab
            label="Свойства"
          >
            <ProjectInfoTab
              project={project}
              isEditable={isEditable}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          </Tab>
          <Tab
            label="Задачи"
          >
            <ProjectTasksTab projectId={project_id || ''} />
          </Tab>
          <Tab
            label="Цели"
          >
            <ProjectGoalsTab projectId={project_id || ''} />
          </Tab>
        </TabsComponent>
      </View>
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
  },
  errorText: {
    color: TextColors.ottoman_red,
    fontSize: 16,
    textAlign: 'center',
  },
});