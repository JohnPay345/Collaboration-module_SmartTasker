import { View, Text, StyleSheet, Image } from 'react-native';
import { Images, MainColors, TextColors } from '@/constants';
import { useEffect } from 'react';
import { router } from 'expo-router';

type SplashScreenType = {
  authLoad: boolean;
  fontsLoad: boolean;
  isAuth: boolean;
}

export const SplashScreen:React.FC<SplashScreenType> = ({authLoad, fontsLoad, isAuth}) => {
  useEffect(() => {
    if(!authLoad) {
      if(isAuth) {
        router.replace("/tasks");
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, []);

  return (
    <View style={[styles.container]}>
      <Image source={Images.logo} style={[styles.icon]} />
      <Text style={[styles.title]}>SmartTasker</Text>
      {fontsLoad && <Text style={styles.loadingText}>Загрузка шрифтов...</Text>}
      {authLoad && <Text style={styles.loadingText}>Загрузка данных...</Text>}
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
  loadingText: {
    color: TextColors.snowbank,
    fontSize: 18,
  },
});
