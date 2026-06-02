import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import React, { useMemo, useRef } from 'react';
import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { router } from 'expo-router';
import { Tab, TabsComponent } from '@/src/components/TabsComponent';
import { TaskInfoTab, type TaskInfoTabRef } from '@/src/tabs/tasks/TaskInfoTab';
import { useCollaborationRoom } from '@src/collab/useCollaborationRoom';
import { normalizeWriteEntry } from '@src/collab/lwwMaterialize';
import { TaskDescriptionTab } from '@/src/tabs/tasks/TaskDescriptionTab';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useCreateTask, useTask, useUpdateTask } from '@src/api/tasks';
import { useUser } from '@src/api/users';

type TaskMode = 'create' | 'view' | 'edit';

interface TaskScreenProps {
  mode: TaskMode;
  taskId?: string;
}

export const TaskScreen: React.FC<TaskScreenProps> = ({ mode = 'edit', taskId }) => {
  const userId = useCurrentUserId();
  const taskRef = useRef<TaskInfoTabRef>(null);

  const taskQuery = useTask({ user_id: userId ?? '', task_id: taskId ?? '' });
  const { data: task, isLoading: taskLoading, isSuccess: taskLoaded } = taskQuery;

  const collabEnabled = mode !== 'create' && !!taskId && !!userId && taskLoaded;
  const collab = useCollaborationRoom(collabEnabled, {
    userId: userId ?? '',
    entityKind: 'task',
    entityId: taskId ?? '',
  });

  const collaboration =
    collabEnabled && userId ? { materialized: collab.materialized, pushWrite: collab.pushWrite } : undefined;

  const { data: meData } = useUser(userId ?? '');
  const colleagues = meData?.colleagues_list ?? [];

  const activeEditorsByField = useMemo(() => {
    if (!collabEnabled || !userId) return {};
    const now = Date.now();
    const cutoff = now - 5_000; // окно "кто сейчас редактирует"

    const seenByField: Record<string, Set<string>> = {};

    // store.writes — журнал последних операций LWW. По нему вычисляем активность.
    const writes = collab.store?.writes ?? [];
    for (const raw of writes) {
      const w = normalizeWriteEntry(raw);
      if (!w || w.t < cutoff) continue;

      if (!w.u || w.u === userId) continue;

      if (!seenByField[w.field]) seenByField[w.field] = new Set();
      seenByField[w.field].add(w.u);
    }

    const toName = (id: string) => {
      const c = colleagues.find((x) => x.user_id === id);
      const name = c
        ? [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ').trim()
        : '';
      return name || 'Пользователь';
    };

    const out: Record<string, string[]> = {};
    for (const [field, idSet] of Object.entries(seenByField)) {
      const names = Array.from(idSet).map(toName);
      out[field] = Array.from(new Set(names));
    }
    return out;
  }, [collabEnabled, userId, collab.store, collab.materialized, colleagues]);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Ошибка', 'Не удалось определить пользователя');
      return;
    }
    const payload = taskRef.current?.getSavePayload();
    if (!payload) {
      Alert.alert('Ошибка', 'Нет данных формы');
      return;
    }
    try {
      if (mode === 'create') {
        payload.task.required_skills = `{${payload.task.required_skills.toString()}}`;
        const created = await createTask.mutateAsync({
          user_id: userId,
          newTask: payload.task as any,
          assignments: payload.assignmentUserIds,
        });
        router.replace(`/(tasks)/${created.task_id}` as any);
      } else if (taskId) {
        payload.task.required_skills = `{${payload.task.required_skills.toString()}}`;
        await updateTask.mutateAsync({
          user_id: userId,
          task_id: taskId,
          updates: payload.task as any,
          assignments: payload.assignmentUserIds,
        });
        router.back();
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Не удалось сохранить';
      Alert.alert('Ошибка', String(msg));
    }
  };

  const saving = createTask.isPending || updateTask.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={handleBack}>
            <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Задача</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSave} disabled={saving || (mode !== 'create' && taskLoading)}>
            {saving ? (
              <ActivityIndicator size="small" color={MainColors.pool_water} />
            ) : (
              <Ionicons name="checkmark" size={35} color={MainColors.pool_water} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <TabsComponent activeTab={0} onTabChange={() => {}}>
        <Tab label="Свойства">
          {mode !== 'create' && taskLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={MainColors.pool_water} />
            </View>
          ) : (
            <TaskInfoTab
              ref={taskRef}
              mode={mode}
              task={task ?? null}
              collaboration={collaboration}
              colleagues={colleagues}
              currentUserId={userId ?? ''}
              activeEditorsByField={activeEditorsByField}
            />
          )}
        </Tab>
        <Tab label="Описание">
          <TaskDescriptionTab />
        </Tab>
      </TabsComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  centered: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  input: {
    fontSize: 16,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  pickerContainer: {
    overflow: 'hidden',
  },
  picker: {
    color: TextColors.dire_wolf,
  },
  infoField: {
    padding: 8,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
    marginHorizontal: 4,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Century-Regular',
  },
  urgencyIcon: {
    alignItems: 'center',
  },
  timelineContainer: {
    height: 2,
    backgroundColor: TextColors.dim_gray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TextColors.dim_gray,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: TextColors.dim_gray,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timelineLabel: {
    fontSize: 10,
    color: TextColors.dim_gray,
    textAlign: 'center',
    flex: 1,
    fontFamily: 'Century-Regular',
  },
  assignButton: {
    width: 180,
    backgroundColor: MainColors.herbery_honey,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  assignButtonText: {
    color: TextColors.dire_wolf,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  addProjectButton: {
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  addProjectButtonText: {
    color: MainColors.pool_water,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  noProjectsContainer: {
    padding: 16,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
    alignItems: 'center',
  },
  noProjectsText: {
    color: TextColors.dim_gray,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  deleteButton: {
    width: 150,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: TextColors.ottoman_red,
  },
  deleteButtonText: {
    color: TextColors.ottoman_red,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  modalItem: {
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
});
