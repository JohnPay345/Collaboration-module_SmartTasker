import { View, Text, StyleSheet, Image } from 'react-native';
import { Images, MainColors, TextColors } from '@/constants';
import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SplashScreen = () => {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
          router.replace('/main');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Ошибка при проверке токенов:', error);
        router.replace('/login');
      }
    };

    const timer = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container]}>
      <Image source={Images.logo} style={[styles.icon]} />
      <Text style={[styles.title]}>SmartTasker</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MainColors.pool_water
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Century-Regular',
    letterSpacing: 1,
    color: TextColors.snowbank
  },
});