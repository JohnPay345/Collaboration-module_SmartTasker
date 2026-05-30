import React from 'react';
import { StyleSheet, View } from 'react-native'
import { MainColors } from '@/constants'
import { router } from 'expo-router'
import { HeaderEditor } from '@src/components/HeaderEditor'

export const FilterScreen = () => {
  const handleBack = () => {
    router.back()
  }

  const handleSave = () => {
    // TODO: Сохранение настроек
    router.back()
  }

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={"Фильтр"}
        onBack={handleBack}
        onSave={handleSave}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: MainColors.white,
  }
});
