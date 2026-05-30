import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { TaskStatus } from '@src/types/statuses';
import { handleApiError, ApiException, ErrorCode } from '@src/services/errors';

export interface Task {
  task_id: string;
  task_name: string;
  description?: string;
  author_id: string;
  author_name: string;
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
  assignment_user_ids?: string[];
  created_at?: Date;
  updated_at?: Date;
}

type ApiEnvelope<T> = {
  code: number;
  url: string;
  message: T;
};

export const useTasks = ({ user_id }: { user_id: string }) => {
  return useQuery({
    queryKey: ['tasks', user_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiEnvelope<Task[]>>(`/api/tasks/${user_id}/list`);
        return data.message ?? [];
      } catch (error) {
        throw handleApiError(error);
      }
    },
    refetchInterval: 30000,
    enabled: !!user_id,
  });
};

export const useProjectTasks = ({
  user_id,
  project_id,
}: {
  user_id: string;
  project_id: string;
}) => {
  const query = useTasks({ user_id });
  const data = (query.data ?? []).filter((t) => t.project_id === project_id);
  return { ...query, data };
};

export const useTask = ({ user_id, task_id }: { user_id: string; task_id: string }) => {
  return useQuery({
    queryKey: ['tasks', user_id, 'task_id', task_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiEnvelope<Task>>(`/api/tasks/${user_id}/${task_id}`);
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!user_id && !!task_id,
    refetchInterval: 30000,
    staleTime: 60_000,
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
    mutationFn: async ({
      newTask,
      user_id,
      assignments,
    }: {
      newTask: Omit<Task, 'task_id' | 'created_at' | 'updated_at'>;
      user_id: string;
      assignments?: string[];
    }) => {
      try {
        const payload: { task: typeof newTask; assignments?: string[] } = { task: newTask };
        if (assignments !== undefined && assignments.length) {
          payload.assignments = assignments;
        }
        const { data } = await api.post<ApiEnvelope<Task>>(`/api/tasks/${user_id}`, { data: payload });
        return data.message;
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
      assignments,
    }: {
      user_id: string;
      task_id: string;
      updates: Partial<Task>;
      assignments?: string[];
    }) => {
      try {
        const payload: { task: Partial<Task>; assignments?: string[] } = { task: updates };
        if (assignments !== undefined) {
          payload.assignments = assignments;
        }
        const { data } = await api.put<ApiEnvelope<Task>>(`/api/tasks/${user_id}/${task_id}`, { data: payload });
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', variables.user_id, 'task_id', variables.task_id],
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables.updates.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', variables.updates.project_id],
          exact: true,
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
        const { data } = await api.delete<ApiEnvelope<string>>(`/api/tasks/${user_id}/${task_id}`);
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: ['tasks', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const task = queryClient.getQueryData<Task>(['tasks', variables.task_id]);
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