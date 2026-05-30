import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { HeaderEditor } from '@src/components/HeaderEditor'
import { MainColors } from '@/constants'
import { router } from 'expo-router'

export const CheckPasswordScreen = () => {
  const [oldPassword, newPassword] = useState('');

  const handleBack = () => {
    router.back();
  }

  const checkPassword = () => {

  }

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={"Основные настройки"}
        onBack={handleBack}
      />

      <TextInput
        placeholder={'Пароль'}
      />

      <TouchableOpacity>
        <Text>Дальше</Text>
      </TouchableOpacity>
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