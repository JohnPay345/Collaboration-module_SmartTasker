import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated } from 'react-native'
import { router } from 'expo-router'
import { MainColors, TextColors } from '@/constants'
import { Ionicons } from '@expo/vector-icons'

type MenuCreateType = {
  isOpen: boolean;
}

export const MenuCreate: React.FC<MenuCreateType> = ({isOpen}) => {
  // TODO: Доработать анимацию
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(value, { toValue: 0, useNativeDriver: true, duration: 300}).start();
    } else {
      Animated.timing(value, { toValue: 1, useNativeDriver: true, duration: 300 }).start();
    }
  }, [isOpen]);

  return (
    <Animated.View style={{opacity: value}}>
      <View style={styles.container_menu}>
        {/*<TouchableOpacity onPress={() => {}}>
          <Ionicons name="people-outline" size={24} color={MainColors.pool_water} />
          <Text>Пригласить коллегу</Text>
        </TouchableOpacity>*/}
        <TouchableOpacity style={[styles.create_project, styles.create_item]} onPress={() => router.push("/(projects)/create")}>
          <Ionicons name="folder-outline" size={30} color={MainColors.white} />
          <Text style={styles.create_item_text}>Новый проект</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.create_task, styles.create_item]} onPress={() => router.push("/(tasks)/create")}>
          <Ionicons name="checkmark-circle-outline" size={30} color={MainColors.white} />
          <Text style={styles.create_item_text}>Новая задача</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
};

const styles = StyleSheet.create({
  container_menu: {
    position: 'absolute',
    top: -95,
    right: 10,
    backgroundColor: MainColors.pool_water,
    padding: 3,
    borderRadius: 5
    /*borderWidth: 1,
    borderColor: MainColors.white,
    borderRadius: 5*/
  },
  create_item: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  create_item_text: {
    marginLeft: 6,
    fontSize: 16,
    color: TextColors.white
  },
  create_task: {
    marginTop: 15
  },
  create_project: {
    marginTop: 15
  },
  fadeAnim: {
    opacity: 1
  }
});
