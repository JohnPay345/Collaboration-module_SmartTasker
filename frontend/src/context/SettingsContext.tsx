import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  defaultScreen: string;
  setDefaultScreen: (screen: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings должен использоваться внутри SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [defaultScreen, setDefaultScreenState] = useState<string>('tasks');

  useEffect(() => {
    // Загружаем сохраненные настройки при первом рендере
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedScreen = await AsyncStorage.getItem('defaultScreen');
      if (savedScreen) {
        setDefaultScreenState(savedScreen);
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
    }
  };

  const setDefaultScreen = async (screen: string) => {
    try {
      await AsyncStorage.setItem('defaultScreen', screen);
      setDefaultScreenState(screen);
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ defaultScreen, setDefaultScreen }}>
      {children}
    </SettingsContext.Provider>
  );
}; 