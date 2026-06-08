import { Stack } from 'expo-router';
import { ThemeProvider } from '@src/context/ThemeContext';
import { SettingsProvider } from '@src/context/SettingsContext';
import { useFonts } from '@src/hooks/useFonts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectChatWebSocket } from '@src/context/ConnectChatWebSocket';
import { RegisterPushToken } from '@src/components/RegisterPushToken';
import { ProjectsProvider } from '@src/context/ProjectsContext';
import { NotificationsProvider } from '@src/context/NotificationsContext';
import { InAppNotificationToast } from '@src/components/InAppNotification';
import { configurePushNotificationHandler } from '@src/services/pushNotifications';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { useState, useEffect } from 'react';
import {AuthProvider, useAuth} from '@src/context/AuthContext';
import { LocaleConfig } from 'react-native-calendars';
import * as ExpoSplashScreen from 'expo-splash-screen';

LocaleConfig.locales['ru'] = {
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
  ],
  monthNamesShort: ['Янв.', 'Февр.', 'Март', 'Апр.', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: "Сегодня",
};
LocaleConfig.defaultLocale = 'ru';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 минут
        gcTime: 1000 * 60 * 15, // 15 минут
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

ExpoSplashScreen.preventAutoHideAsync();

configurePushNotificationHandler();

const Screens = () => {
  const { fontsLoaded } = useFonts();
  const {loading} = useAuth();

  useEffect(() => {
    if (fontsLoaded && !loading) {
      ExpoSplashScreen.hideAsync()
        .then(() => {
          console.log("ExpoSplashScreen скрыт");
        })
        .catch((err) => {
          console.warn("Ошибка скрытия сплэша:", err);
        });
    }
  }, [fontsLoaded, loading]);

  if (!fontsLoaded || loading) {
    return null; 
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'none'
    }}>
      <Stack.Screen name='(tasks)/tasks' options={{title: 'Задачи'}}/>
      <Stack.Screen name='(tasks)/[task_id]' options={{title: 'Задача'}}/>
      <Stack.Screen name='(tasks)/create' options={{title: 'Создание задачи'}}/>
      <Stack.Screen name='(projects)/projects' options={{title: 'Проекты'}}/>
      <Stack.Screen name='(projects)/[project_id]' options={{title: 'Проект'}}/>
      <Stack.Screen name='(projects)/create' options={{title: 'Создание проекта'}}/>
      <Stack.Screen name='profile' options={{title: 'Профиль'}}/>
      <Stack.Screen name='(settings)/settings' options={{title: 'Настройки'}}/>
      <Stack.Screen name='(settings)/main_settings' options={{title: 'Основные настройки'}}/>
      <Stack.Screen name='(settings)/notifications_settings' options={{title: 'Настройки уведомлений'}}/>
      <Stack.Screen name="inbox" options={{title: 'Уведомления'}}/>
      <Stack.Screen name="filter" options={{title: 'Фильтр'}}/>
      <Stack.Screen name="(follows)/follows" options={{title: 'Коллеги'}}/>
      <Stack.Screen name="(follows)/[follow_id]" options={{title: 'Коллега'}}/>
      <Stack.Screen name='(auth)/login' options={{title: 'Вход'}}/>
      <Stack.Screen name='(auth)/register' options={{title: 'Регистрация'}}/>
      <Stack.Screen name="(password)/resetpass" options={{title: 'Сброс пароля'}}/>
      <Stack.Screen name="(password)/checkpass" options={{title: 'Проверка паролем'}}/>
    </Stack>
  )
};

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <ProjectsProvider>
            <AuthProvider>
              <NotificationsProvider>
                <ConnectChatWebSocket />
                <RegisterPushToken />
                <InAppNotificationToast />
                <Screens />
              </NotificationsProvider>
            </AuthProvider>
          </ProjectsProvider>
        </SettingsProvider>
      </ThemeProvider>
      <DevToolsBubble queryClient={queryClient}/>
    </QueryClientProvider>
  );
}
