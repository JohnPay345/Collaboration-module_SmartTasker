import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { MainColors, TextColors } from '@/constants';
import { router, useLocalSearchParams } from 'expo-router';
import { HeaderEditor } from '@src/components/HeaderEditor';
import { ProjectInfoTab } from '@src/tabs/projects/ProjectInfoTab';
import { ProjectTasksTab } from '@src/tabs/projects/ProjectTasksTab';
import { TabsComponent, Tab } from '@src/components/TabsComponent';
import { useProject, useUpdateProject, useDeleteProject, useCreateProject } from '@src/api/projects';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@src/schemas/project.schema';
import { ProjectStatus } from '@src/types/statuses';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useCollaborationRoom } from '@src/collab/useCollaborationRoom';
import { useUser } from '@src/api/users';

function parseTagsFromForm(tags: string | undefined): string[] {
  if (!tags?.trim()) return [];
  const cleaned = tags.replace(/^\{|\}$/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map((t) => t.trim()).filter(Boolean);
}

export const ProjectScreen = () => {
  const { project_id } = useLocalSearchParams<{ project_id: string }>();
  const userId = useCurrentUserId();
  const isCreateMode = !project_id;

  const projectQuery = useProject({ user_id: userId ?? '', project_id: project_id ?? '' });
  const { data: project, isLoading: projectLoading, isSuccess: projectLoaded } = projectQuery;

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const isEditable = true;

  const collabEnabled = !isCreateMode && !!project_id && !!userId && projectLoaded;
  const collab = useCollaborationRoom(collabEnabled, {
    userId: userId ?? '',
    entityKind: 'project',
    entityId: project_id ?? '',
  });

  const collaboration =
    collabEnabled && userId ? { materialized: collab.materialized, pushWrite: collab.pushWrite } : undefined;

  const { data: meData } = useUser(userId ?? '');
  const colleagues = meData?.colleagues_list ?? [];

  const activeEditorsByField = useMemo(() => {
    if (!collabEnabled || !userId) return {};
    const now = Date.now();
    const cutoff = now - 30_000;

    const seenByField: Record<string, Set<string>> = {};
    const writes = (collab.store?.writes ?? []) as any[];

    for (const w of writes) {
      if (!w || typeof w.value.field !== 'string') continue;
      if (typeof w.value.t !== 'number' || w.value.t < cutoff) continue;

      const editorId = String(w.value.u ?? '');
      if (!editorId || editorId === userId) continue;

      if (!seenByField[w.value.field]) seenByField[w.value.field] = new Set();
      seenByField[w.value.field].add(editorId);
    }

    const toName = (id: string) => {
      const c = colleagues.find((x) => x.user_id === id);
      const name = c ? [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ').trim() : '';
      return name || 'Пользователь';
    };

    const out: Record<string, string[]> = {};
    for (const [field, idSet] of Object.entries(seenByField)) {
      const names = Array.from(idSet).map(toName);
      out[field] = Array.from(new Set(names));
    }
    return out;
  }, [collabEnabled, userId, collab.store, collab.materialized, colleagues]);

  const [isVisible, setIsVisible] = useState(false);
  const [projectAssignmentIds, setProjectAssignmentIds] = useState<string[]>([]);

  const { handleSubmit, control, formState: { errors }, reset, setValue } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      project_name: project?.project_name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'В работе',
      start_date: new Date(),
      end_date: new Date(),
      author_id: userId ?? '',
      tags: project?.tags?.length ? `{${project.tags.join(',')}}` : '',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  useEffect(() => {
    if (project && !isCreateMode) {
      setValue('project_name', project?.project_name);
      setValue('description', project?.description || '');
      setValue('status', project?.status as ProjectStatus);
      setValue('start_date', new Date(project?.start_date));
      setValue('end_date', new Date(project?.end_date));
      setValue('author_id', project?.author_id);
      setValue('tags', `{${project?.tags?.toString()}}` || '');
      setValue('created_at', project?.created_at ? new Date(project.created_at) : new Date());
      setValue('updated_at', project?.updated_at ? new Date(project.updated_at) : new Date());
      setProjectAssignmentIds(project.assignment_user_ids ?? []);
    }
  }, [project, isCreateMode, setValue]);

  useEffect(() => {
    if (isCreateMode) {
      setProjectAssignmentIds([]);
    }
  }, [isCreateMode]);

  const changeIsVisible = (newState: boolean) => {
    setIsVisible(newState);
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteConfirm = async (pid: string) => {
    if (!userId) return;
    await deleteProject.mutateAsync({ user_id: userId, project_id: pid });
    router.back();
  };

  const onSave = handleSubmit(async (data) => {
    if (!userId) return;
    try {
      if (isCreateMode) {
        const created = await createProject.mutateAsync({
          user_id: userId,
          newProject: {
            project_name: data.project_name,
            description: data.description ?? '',
            status: data.status,
            author_id: userId,
            start_date: data.start_date,
            end_date: data.end_date,
            tags: `{${data.tags}}`,
          },
          assignments: projectAssignmentIds,
        });
        const id = (created as any)?.project_id;
        if (id) {
          router.replace(`/(projects)/${id}` as any);
        } else {
          router.back();
        }
      } else if (project_id) {
        await updateProject.mutateAsync({
          user_id: userId,
          project_id: project_id,
          project: {
            project_name: data.project_name,
            description: data.description,
            status: data.status,
            start_date: data.start_date,
            end_date: data.end_date,
            author_id: data.author_id,
            tags: /^\{|\}$/g.test(data.tags) ? data.tags : `{${data.tags.toString()}`,
          },
          assignments: projectAssignmentIds,
        });
        reset(data, { keepDirty: false });
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Ошибка', String(e?.message ?? e));
    }
  });

  return (
    <View style={styles.container}>
      <HeaderEditor title={'Проекты'} onBack={handleBack} onSave={onSave} />
      <View style={styles.content}>
        {!isCreateMode && projectLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={MainColors.pool_water} />
          </View>
        ) : (
          <TabsComponent activeTab={0} onTabChange={() => {}}>
            <Tab label="Свойства">
              <ProjectInfoTab
                project={project}
                isEditable={isEditable}
                isVisible={isVisible}
                changeVisible={changeIsVisible}
                onDeleteProject={handleDeleteConfirm}
                errors={errors}
                control={control}
                setValue={setValue}
                collaboration={collaboration}
                assignmentUserIds={projectAssignmentIds}
                onAssignmentUserIdsChange={setProjectAssignmentIds}
                colleagues={colleagues}
                activeEditorsByField={activeEditorsByField}
              />
            </Tab>
            {!isCreateMode && project_id ? (
              <Tab label="Задачи">
                <ProjectTasksTab projectId={project_id} userId={userId ?? ''} />
              </Tab>
            ) : null}
          </TabsComponent>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: TextColors.ottoman_red,
    fontSize: 16,
    textAlign: 'center',
  },
});
