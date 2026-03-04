import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MainColors, TextColors } from '@/constants'
import React, { useState } from 'react'
import { BurgerMenu } from '@src/components/BurgerMenu'

interface Header {
  titleScreen: string;
}

export const Header: React.FC<Header> = ({titleScreen = 'Шаблон экрана'}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <View style={styles.header}>
      <Text style={styles.headerTitle}>{titleScreen}</Text>
      <TouchableOpacity onPress={() => router.push("/inbox")}>
        <Ionicons name="notifications-outline" size={30} color={TextColors.pool_water} />
      </TouchableOpacity>
    </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor="#868686"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={30} color={TextColors.pool_water} />
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInputContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MainColors.snowbank,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    color: '#868686',
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  filterButton: {
    padding: 8,
  },
});