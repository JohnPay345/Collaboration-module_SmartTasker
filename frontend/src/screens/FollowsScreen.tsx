import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { MainColors } from '@/constants'
import React, { useEffect, useState } from 'react'
import { Header } from '@src/components/Header'
import { Footer } from '@src/components/Footer'
import { useUser } from '@src/api/users'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ColleaguesItem } from '@src/components/ColleaguesItem'
import { FailedLoadContent } from '@src/components/FailedLoadContent'
import { useCurrentUserId } from '@src/hooks/useCurrentUserId'

export const FollowsScreen = () => {
  const userId = useCurrentUserId();
  const { data, isLoading, isError, error, refetch } = useUser(userId ?? '');

  return (
    <View style={styles.container}>
      <Header titleScreen={'Коллеги'}/>

      {!userId ? (
        <View style={styles.failedContainer}>
          <Text style={styles.failedText}>Загрузка профиля...</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MainColors.pool_water}/>
          <Text style={styles.loadingText}>Загрузка коллег...</Text>
        </View>
      ) : isError ? (
        <View style={styles.failedContainer}>
          <Text style={styles.failedText}>Не удалось загрузить коллег.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : data?.colleagues_count != null ?
            <ScrollView style={styles.content}>
              {data.colleagues_list.map((user, key) => (
                <ColleaguesItem
                  key={key}
                  user_id={user.user_id}
                  first_name={user.first_name}
                  middle_name={user.middle_name}
                  last_name={user.last_name}
                  job_title={user.job_title}
                  avatarPath={user.avatarPath}
                />
              ))}
            </ScrollView> : <FailedLoadContent text={"К сожалению коллег найти не удалось"} />}

      <Footer/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
    marginTop: 10,
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
  }
});