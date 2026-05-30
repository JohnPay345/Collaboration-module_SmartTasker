import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { ProjectStatus } from '@/src/types/statuses';
import { handleApiError, ApiException, ErrorCode } from '@src/services/errors';

export interface Projects {
  evaluations: [];
  data: {
    project_id: string;
    project_name: string;
    project_description: string;
    status: ProjectStatus;
    author_id: string;
  }[]
}

export type ProjectGoal = {
  project_goal_id: string;
  goal_name: string;
  goal_description?: string;
  target_date: Date;
  goal_status: string;
};

export interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  status: ProjectStatus;
  author_id: string;
  tags?: string[];
  assignment_user_ids?: string[];
  created_at?: Date;
  updated_at?: Date;
  goals?: ProjectGoal[];
  assignments?: { project_assignment_id?: string; user_id: string }[];
}

export type CreateProjectInput = Pick<
  Project,
  'project_name' | 'description' | 'status' | 'author_id' | 'start_date' | 'end_date'
> & {
  tags?: string[];
};

type ApiEnvelope<T> = {
  code: number;
  url: string;
  message: T;
};

export const useProjects = (user_id: string) => {
  return useQuery({
    queryKey: ['projects', user_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiEnvelope<Projects | Project[]>>(`/api/projects/${user_id}/list`);
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    refetchInterval: 30000,
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

export const useProject = ({ user_id, project_id }: { user_id: string; project_id: string }) => {
  return useQuery({
    queryKey: ['projects', user_id, 'project_id', project_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiEnvelope<Project[]>>(`/api/projects/${user_id}/${project_id}`);
        const row = data.message[0];
        if (!row) return undefined;
        const raw = row.assignments;
        const assignment_user_ids = Array.isArray(raw)
          ? (raw.map((a: { user_id?: string }) => a?.user_id).filter(Boolean) as string[])
          : [];
        return { ...row, assignment_user_ids } as Project;
      } catch (error) {
        console.log(error);
        throw handleApiError(error);
      }
    },
    enabled: !!user_id && !!project_id,
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

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      newProject,
      assignments,
    }: {
      user_id: string;
      newProject: CreateProjectInput;
      assignments?: string[];
    }) => {
      try {
        const payload: { project: typeof newProject; assignments?: string[] } = { project: newProject };
        if (assignments !== undefined && assignments.length) {
          payload.assignments = assignments;
        }
        const { data } = await api.post<ApiEnvelope<Project>>(`/api/projects/${user_id}`, { data: payload });
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects', vars.user_id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.VALIDATION_ERROR) {
        console.error('Validation errors:', error.details);
      }
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      project_id,
      project,
      assignments,
    }: {
      user_id: string;
      project_id: string;
      project: Partial<Project>;
      assignments?: string[];
    }) => {
      try {
        const payload: { project: Partial<Project>; assignments?: string[] } = { project };
        if (assignments !== undefined) {
          payload.assignments = assignments;
        }
        const { data } = await api.put<ApiEnvelope<Project>>(`/api/projects/${user_id}/${project_id}`, { data: payload });
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', vars.user_id, 'project_id', vars.project_id],
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, project_id }: { user_id: string, project_id: string }) => {
      try {
        const { data } = await api.delete<ApiEnvelope<string>>(`/api/projects/${user_id}/${project_id}`);
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: ['projects', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.ACCESS_DENIED) {
        console.error('Access denied when deleting project');
      }
    },
  });
};
