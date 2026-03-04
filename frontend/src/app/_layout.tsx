import { Stack } from 'expo-router';
import { ThemeProvider } from '@src/context/ThemeContext';
import { SettingsProvider } from '@src/context/SettingsContext';
import { useFonts } from '@src/hooks/useFonts';
import { View, Text, StyleSheet } from 'react-native';
import { MainColors, TextColors } from '@/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from '@src/components/AuthGuard';
import { ConnectChatWebSocket } from '@src/components/ConnectChatWebSocket';
import { ProjectsProvider } from '@src/context/ProjectsContext';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { useState } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 минут
        gcTime: 1000 * 60 * 30, // 30 минут
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

const Screens = () => {
  return (
    <>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'none'
      }}>
        <Stack.Screen name='(auth)/login' options={{title: 'Вход',}}/>
        <Stack.Screen name='(auth)/register' options={{title: 'Регистрация',}}/>
        <Stack.Screen name='(tasks)/tasks' options={{title: 'Задачи',}}/>
        <Stack.Screen name='(tasks)/[task_id]' options={{title: 'Задача',}}/>
        <Stack.Screen name='(tasks)/create' options={{title: 'Создание задачи',}}/>
        <Stack.Screen name='(projects)/projects' options={{title: 'Проекты',}}/>
        <Stack.Screen name='(projects)/[project_id]' options={{title: 'Проект',}}/>
        <Stack.Screen name='(projects)/create' options={{title: 'Создание проекта',}}/>
        <Stack.Screen name='profile' options={{title: 'Профиль',}}/>
        <Stack.Screen name='settings' options={{title: 'Настройки',}}/>
        <Stack.Screen name="inbox" options={{title: 'Уведомления'}}/>
        <Stack.Screen name="(follows)/follows" options={{title: 'Коллеги'}}/>
        <Stack.Screen name="(follows)/[follow_id]" options={{title: 'Коллега'}}/>
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  const { fontsLoaded } = useFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка шрифтов...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <ProjectsProvider>
            <ConnectChatWebSocket />
            <Screens />
          </ProjectsProvider>
        </SettingsProvider>
      </ThemeProvider>
      <DevToolsBubble queryClient={queryClient}/>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.pool_water,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: TextColors.snowbank,
    fontSize: 18,
  },
}); 