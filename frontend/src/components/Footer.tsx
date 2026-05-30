import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MainColors, TextColors } from '@/constants'
import React, { useState } from 'react'
import { BurgerMenu } from '@src/components/BurgerMenu'
import { MenuCreate } from '@src/components/MenuCreate'

export const Footer = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateMenu, setIsCreateMenu] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {isCreateMenu && <MenuCreate isOpen={isMenuOpen}/>}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsMenuOpen(true)}
          >
            <Ionicons name="menu" size={35} color={MainColors.pool_water}/>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreateMenu(!isCreateMenu)}
          >
            <Ionicons name="add" size={35} color={MainColors.pool_water}/>
          </TouchableOpacity>
        </View>
      </View>
      <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}/>
    </>
  )
}

const styles = StyleSheet.create({
  container: {

  },
  bottomNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: MainColors.pool_water,
    borderRadius: 50,
  },
});