import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, removeToken } from '@src/services/tokenStorage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router';
import { disconnectChatWebSocket } from '@/src/services/chatWebSocket';
import { useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  loading: boolean;
  isAuthenticated: boolean;
  login: (response: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isAuthenticated: false,
  login: (response: any) => {},
  logout: () => {}
});

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const bootstrap = async () => {
    try {
      const token = await getToken();
      if(!token) throw new Error("No token found");
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      const raw = await AsyncStorage.getItem("user_data");
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
    await AsyncStorage.setItem('user_data', JSON.stringify({user_id: response.message.user_id}));
    await setToken(response.message.access_token);
    setIsAuthenticated(true);
    setLoading(false);
  }

  const logout = async () => {
    disconnectChatWebSocket();
    removeToken();
    await AsyncStorage.removeItem("user_data");
    queryClient.clear();
    setIsAuthenticated(false);
    setLoading(true);
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