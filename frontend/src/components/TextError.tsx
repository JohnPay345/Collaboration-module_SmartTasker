import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface TextError {
  text: string;
}

export const TextError: React.FC<TextError> = ({text = 'Ошибка'}) => {
  return (
    <Text style={styles.error}>{text}</Text>
  )
}

const styles = StyleSheet.create({
  error: {
    color: '#f24b21',
    fontSize: 16,
  },
});