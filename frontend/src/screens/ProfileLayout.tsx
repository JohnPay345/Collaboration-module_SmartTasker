import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@src/context/ThemeContext';
import { Button } from '@/src/components/Button';
import { router } from 'expo-router';

export const ProfileLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: theme.colors.text }]}>Иван Иванов</Text>
        <Text style={[styles.email, { color: theme.colors.secondary }]}>
          ivan@example.com
        </Text>
      </View>

      <View style={styles.content}>
        <Button
          title="Редактировать профиль"
          onPress={() => { }}
          variant="primary"
        />
        <Button
          title="Сменить тему"
          onPress={toggleTheme}
          variant="secondary"
        />
        <Button
          title="Выйти"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
  },
  content: {
    padding: 20,
    gap: 12,
  },
}); 