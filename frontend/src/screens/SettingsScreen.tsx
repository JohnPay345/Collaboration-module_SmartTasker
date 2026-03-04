import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import React from 'react';
import { EvilIcons, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MainColors, TextColors, Images } from '@/constants';
import { router } from 'expo-router';
import { SvgProps, SvgXml } from 'react-native-svg';

type SettingsItemProps = {
  title: string;
  settingsIcon: React.ReactNode;
  onPress?: () => void;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ title, settingsIcon, onPress }) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemLeft}>
      {settingsIcon}
      <Text style={styles.settingsItemText}>{title}</Text>
    </View>
    <MaterialIcons name="keyboard-arrow-right" size={35} color={TextColors.dire_wolf} />
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const handleBack = () => {
    router.back()
  }

  const handleSave = () => {
    // TODO: Сохранение настроек
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={handleBack}>
            <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Настройки</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Ionicons name="checkmark" size={35} color={MainColors.pool_water} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SettingsItem
            title="Основные"
            settingsIcon={<Feather name="settings" size={35} color={TextColors.pool_water} />}
            onPress={() => { }}
          />
          <SettingsItem
            title="Уведомления"
            settingsIcon={<Ionicons name="notifications-outline" size={35} color={TextColors.pool_water} />}
            onPress={() => { }}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
    backgroundColor: MainColors.white,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 12,
  },
});