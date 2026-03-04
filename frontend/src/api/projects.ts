import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { GoalStatus, ProjectStatus } from '@/src/types/statuses';
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

export interface Project {
  project_id: string;
  project_name: string;
  project_description?: string;
  start_date: Date;
  end_date: Date;
  status: ProjectStatus;
  author_id: string;
  tags?: string[];
  project_goal_id: string;
  goal_name: string;
  goal_description?: string;
  target_date: Date;
  goal_status: GoalStatus;
  project_assignment_id: string;
  user_id: string;
}

export const useProjects = (user_id: string) => {
  return useQuery({
    queryKey: ['projects', user_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Projects>(`/projects/${user_id}/list`);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
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

export const useProject = ({ user_id, project_id }: { user_id: string, project_id: string }) => {
  return useQuery({
    queryKey: ['projects', user_id, 'project_id', project_id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Project>(`/projects/${user_id}/${project_id}`);
        return data;
      } catch (error) {
        console.log(error);
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

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, newProject }: { user_id: string, newProject: Omit<Project, 'project_id' | 'created_at' | 'updated_at'> }) => {
      try {
        const { data } = await api.post<Project>(`/projects/${user_id}`, newProject);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.project_id] });
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
    mutationFn: async ({ user_id, project_id, ...project }: Partial<Project> & { user_id: string, project_id: string }) => {
      try {
        const { data } = await api.patch<Project>(`/projects/${project_id}`, project);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', data.project_id], data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, project_id }: { user_id: string, project_id: string }) => {
      try {
        const { data } = await api.delete(`/projects/${user_id}/${project_id}`);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (project_id) => {
      queryClient.removeQueries({ queryKey: ['projects', project_id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: ApiException) => {
      if (error.code === ErrorCode.ACCESS_DENIED) {
        console.error('Access denied when deleting project');
      }
    },
  });
};
