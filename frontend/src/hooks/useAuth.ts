import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { useRouter } from 'expo-router';
import { getToken, setToken, removeToken } from '@/src/services/tokenStorage';
import { disconnectChatWebSocket } from '@/src/services/chatWebSocket';

export const useAuth = () => {
  const router = useRouter();

  const updateTokens = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { data } = await api.get(`/updateTokens/${userId}`);
        if (data.result) {
          setToken(data.result);
          return data.result;
        }
        throw new Error('Failed to update tokens');
      } catch (error) {
        removeToken();
        router.replace('/(auth)/login');
        throw error;
      }
    }
  });

  const checkAuth = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token found');
      }
      return token;
    },
    retry: false,
    staleTime: Infinity,
  });

  const logout = async () => {
    disconnectChatWebSocket();
    removeToken();
    router.replace('/(auth)/login');
  };

  return {
    updateTokens,
    checkAuth,
    logout,
    isAuthenticated: !!checkAuth.data,
    isLoading: checkAuth.isLoading,
    error: checkAuth.error
  };
}; 