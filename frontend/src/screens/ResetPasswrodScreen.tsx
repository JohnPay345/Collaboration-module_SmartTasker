import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React, { useState } from 'react'
import { HeaderEditor } from '@src/components/HeaderEditor'
import { MainColors } from '@/constants'
import { router } from 'expo-router'

type ResetPasswordScreen = {
  screen: string;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreen> = ({screen = 'Login'}) => {
  const [password, setPassword] = useState({
    newPassword: '',
    doublePassword: ''
  });

  const handleBack = () => {
    router.back();
  }

  const changePassword = () => {
    return;
  }

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={"Основные настройки"}
        onBack={handleBack}
      />

      <TextInput
        placeholder={'Новый пароль'}
      />

      <TextInput
        placeholder={'Новый пароль (повторите)'}
      />

      <TouchableOpacity onPress={changePassword}>
        <Text>Изменить пароль</Text>
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