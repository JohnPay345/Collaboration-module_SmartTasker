import { View, Text, StyleSheet, Image } from 'react-native';
import { Images, MainColors, TextColors } from '@/constants';
import { useEffect } from 'react';
import { router, Slot } from 'expo-router';

export const SplashScreen = () => {
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
  loadingText: {
    color: TextColors.snowbank,
    fontSize: 18,
  },
});
