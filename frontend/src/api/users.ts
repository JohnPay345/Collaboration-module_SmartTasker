import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { handleApiError, ApiException, ErrorCode } from '@src/services/errors';

interface Response<T> {
  code: number;
  url: string;
  message: T;
}

export interface User {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  birth_date: Date;
  start_date: Date;
  gender: 'Мужчина' | 'Женщина';
  address?: string;
  job_title: string;
  avatarpath: string;
  last_login?: Date;
  skills?: string[];
}

interface Collegues {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  birth_date: Date;
  start_date: Date;
  gender: 'Мужчина' | 'Женщина';
  address?: string;
  job_title: string;
  avatarpath: string;
  last_login?: Date;
  skills?: string[];
  created_user_id?: string;
  colleagues_list: User[];
  colleagues_count: number;
  connections_status?: string;
}

export type UserWithColleaguesApiResponse = Response<Collegues>;

export interface AuthResponse {
  code: string;
  url: string;
  message: {
    user_id: string;
    access_token: string;
  }
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  data: {
    user: {
      first_name: string;
      middle_name: string;
      last_name?: string;
      email: string;
      password: string;
      birth_date: Date;
      gender: 'Мужчина' | 'Женщина';
      phone_number?: string;
    }
    user_device: {
      device_type: 'android' | 'ios' | 'web',
      device_token: string
    }
  }
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data } = await api.get<UserWithColleaguesApiResponse & { message: User[] }>('/api/users');
        return data.message;
      } catch (error) {
        console.error(error);
        throw handleApiError(error);
      }
    }
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      try {
        const { data } = await api.get<UserWithColleaguesApiResponse>(`/api/users/${id}`);
        return data.message;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!id,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const { data } = await api.post<AuthResponse>('/api/login', credentials);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', 'me'], data.message.user_id);
    },
    onError: (error: ApiException) => {
      console.error(error);
      if (error.code === ErrorCode.INVALID_CREDENTIALS) {
        queryClient.removeQueries({ queryKey: ['users', 'me'] });
      }
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const { data } = await api.post<AuthResponse>('/api/register', userData);
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', 'me'], data.message.user_id);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      userData,
      avatarFile
    }: {
      user_id: string;
      userData?: Partial<User>;
      avatarFile?: File;
    }) => {
      try {
        const formData = new FormData();

        if (userData) {
          Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined) {
              formData.append(key, value.toString());
            }
          });
        }

        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }

        const { data } = await api.put<User>(`/api/users/${user_id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', data.user_id], data);
      queryClient.setQueryData(['users'], (oldData: User[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(user =>
          user.user_id === data.user_id ? data : user
        );
      });
    },
  });
};
