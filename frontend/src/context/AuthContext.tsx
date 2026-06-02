import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from '@src/services/tokenStorage'
import { useCurrentUserId } from '@src/hooks/useCurrentUserId'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUser } from '@src/api/users'

type AuthContextType = {
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isAuthenticated: false
});

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => useContext(AuthContext);