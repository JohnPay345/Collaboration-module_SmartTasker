import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { handleApiError, ApiException, ErrorCode } from '@src/services/errors';

interface Response {
  code: string;
  url: string;
}

export interface User extends Response {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  password: string;
  birth_date: Date;
  start_date: Date;
  gender: 'Мужчина' | 'Женщина';
  address?: string;
  job_title: string;
  avatarPath: string;
  last_login?: Date;
  skills?: string[];
  created_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

interface Collegues extends User, Response {
  message: {
    colleagues_list: User[];
    colleagues_count: number;
    connections_status?: string;
  }
}

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
        console.log('asdf')
        const { data } = await api.get<User[]>('/api/users');
        return data;
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
        const { data } = await api.get<Collegues>(`/api/users/${id}`);
        return data;
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
        const { data } = await api.post<AuthResponse>('/register', userData);
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

        const { data } = await api.put<User>(`/users/${user_id}`, formData, {
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
