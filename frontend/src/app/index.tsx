import { SplashScreen } from '@src/screens/SplashScreen';
import {useAuth} from '@src/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      router.replace('/(tasks)/tasks');
    } else {
      router.replace('/(auth)/login');
    }
  }, [loading, isAuthenticated]);

  return <SplashScreen />;
} 