import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { MainColors } from '@/constants'

type LoadingContentType = {
  loadingText: string;
}

export const LoadingContent: React.FC<LoadingContentType> = ({loadingText = 'Загрузка...'}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={MainColors.pool_water} />
      <Text style={styles.loadingText}>{loadingText}</Text>
    </View>
  )
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
  },
});