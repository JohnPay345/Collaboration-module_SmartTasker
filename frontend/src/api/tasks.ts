import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { TaskStatus } from '@src/types/statuses';
import { handleApiError, ApiException, ErrorCode } from '@src/services/errors';

export interface Task {
  task_id: string;
  task_name: string;
  description?: string;
  author_id: string;
  project_id?: string;
  goal_id?: string;
  start_date: Date;
  end_date: Date;
  status: TaskStatus;
  is_urgent: boolean;
  priority: string;
  value: string;
  effort: string;
  estimated_duration: number;
  priority_assessment: number;
  qualification_assessment: number;
  load_assessment: number;
  required_skills?: string[];
}

export const useTasks = ({ user_id }: { user_id: string }) => {
  return useQuery({
    queryKey: ['tasks', user_id],
    queryFn: async () => {
      try {
        const url = `/tasks/${user_id}/list`;
        const { data } = await api.get<Task[]>(url);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !user_id || !!user_id,
  });
};

export const useTask = ({ user_id, task_id }: { user_id: string, task_id: string }) => {
  return useQuery({
    queryKey: ['tasks', user_id, 'task_id', task_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Task>(`/tasks/${user_id}/${task_id}`);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!user_id,
    retry: (failureCount, error) => {
      if (error instanceof ApiException &&
        (error.code === ErrorCode.UNAUTHORIZED ||
          error.code === ErrorCode.ACCESS_DENIED)) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ newTask, user_id }: { newTask: Omit<Task, 'task_id' | 'created_at' | 'updated_at'>, user_id: string }) => {
      try {
        const { data } = await api.post<Task>(`/tasks/${user_id}`, newTask);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', data.project_id],
          exact: true
        });
      }
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.VALIDATION_ERROR) {
        console.error('Validation errors:', error.details);
      }
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      task_id,
      updates,
      type = 'general' // 'general' | 'status' | 'assign'
    }: {
      user_id: string;
      task_id: string;
      updates: Partial<Task> | { status: TaskStatus } | { assigneeId: string };
      type?: 'general' | 'status' | 'assign';
    }) => {
      try {
        let endpoint = `/tasks/${task_id}/${user_id}`;
        let payload = updates;

        // Определяем эндпоинт и метод в зависимости от типа обновления
        switch (type) {
          case 'status':
            endpoint = `/tasks/${task_id}/status`;
            payload = { status: (updates as { status: TaskStatus }).status };
            break;
          case 'assign':
            endpoint = `/tasks/${task_id}/assign`;
            payload = { assigneeId: (updates as { assigneeId: string }).assigneeId };
            break;
        }

        const { data } = await api.patch<Task>(endpoint, payload);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      // Обновляем данные в кэше
      queryClient.setQueryData(['tasks', data.task_id], data);

      // Инвалидируем списки задач
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Если задача в проекте, обновляем список задач проекта
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', data.project_id],
          exact: true
        });
      }
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.VALIDATION_ERROR) {
        console.error('Validation errors:', error.details);
      } else if (error.code === ErrorCode.ACCESS_DENIED) {
        console.error('Access denied when updating task');
      }
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, task_id }: { user_id: string, task_id: string }) => {
      try {
        const { data } = await api.delete(`/tasks/${user_id}/${task_id}`);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (task_id) => {
      queryClient.removeQueries({ queryKey: ['tasks', task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const task = queryClient.getQueryData<Task>(['tasks', task_id]);
      if (task?.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', task.project_id],
          exact: true
        });
      }
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.ACCESS_DENIED) {
        console.error('Access denied when deleting task');
      }
    },
  });
}; 