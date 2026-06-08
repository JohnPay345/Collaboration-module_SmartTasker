import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, removeToken } from '@src/services/tokenStorage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useSegments } from 'expo-router';
import { disconnectChatWebSocket } from '@/src/services/chatWebSocket';
import { useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  loading: boolean;
  isAuthenticated: boolean;
  login: (response: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isAuthenticated: false,
  login: async (response: any) => {},
  logout: () => {}
});

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const bootstrap = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      const raw = await AsyncStorage.getItem("user_data");
      if (!raw) return;
      const currentUser = JSON.parse(raw).user_id;
      if(userId == currentUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (response: any) => {
     try {
      setLoading(true);
      await AsyncStorage.setItem('user_data', JSON.stringify({user_id: response.message.user_id}));
      await setToken(response.message.access_token);
      setIsAuthenticated(true);
    } catch (e) {
      console.error("Ошибка при сохранении данных логина:", e);
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    disconnectChatWebSocket();
    removeToken();
    await AsyncStorage.removeItem("user_data");
    queryClient.clear();
    setIsAuthenticated(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => useContext(AuthContext);