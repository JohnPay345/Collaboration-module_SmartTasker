import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MainColors, TextColors } from '@/constants'
import React, { useState } from 'react'
import { EvilIcons, Ionicons } from '@expo/vector-icons'
import { Tab, TabsComponent } from '@src/components/TabsComponent'
import { router } from 'expo-router'
import { ColleagueProfileTab } from '@src/tabs/follows/ColleagueProfileTab'
import { ColleagueChatTab } from '@src/tabs/follows/ColleagueChatTab'

interface FollowScreen {
  follow_id?: string;
}

export const FollowScreen: React.FC<FollowScreen> = ({follow_id}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerButton}>
              <TouchableOpacity onPress={handleBack}>
                <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Коллега</Text>
            </View>
          </View>
          <TabsComponent activeTab={0} onTabChange={(index) => { }}>
            <Tab label="Профиль">
              <ColleagueProfileTab />
            </Tab>
            <Tab label="Чат">
              <ColleagueChatTab peerId={follow_id ?? undefined} />
            </Tab>
          </TabsComponent>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text>К сожалению информацию найти не удалось.</Text>
          <Text>Возможно он отсутствует или же удалён.</Text>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  content: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
});