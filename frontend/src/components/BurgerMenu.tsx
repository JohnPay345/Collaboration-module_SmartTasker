import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { router, RelativePathString, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Images, MainColors, TextColors } from '@/constants';

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_WIDTH = Dimensions.get('window').width * 0.70;

type AppRoute = '/profile' | '/follows' | '/tasks' | '/projects' | '/settings';

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleNavigation = (route: AppRoute) => {
    onClose();
    router.push(route as RelativePathString);
  };

  const isActiveRoute = (route: AppRoute) => {
    return pathname.startsWith(route);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            display: isOpen ? 'flex' : 'none',
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        onTouchStart={onClose}
      />

      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Image source={Images.logo} style={styles.logo} />
          <Text style={styles.appName}>SmartTasker</Text>
        </View>

        <View style={styles.menuContent}>
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={[styles.menuItem, isActiveRoute('/profile') && styles.activeMenuItem]}
              onPress={() => handleNavigation('/profile')}
            >
              <Ionicons name="person-outline" size={24} color={MainColors.pool_water} />
              <Text style={styles.menuItemText}>Профиль</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isActiveRoute('/follows') && styles.activeMenuItem]}
              onPress={() => handleNavigation('/follows')}
            >
              <Image style={styles.image} source={Images.employees}/>
              <Text style={styles.menuItemText}>Коллеги</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isActiveRoute('/tasks') && styles.activeMenuItem]}
              onPress={() => handleNavigation('/tasks')}
            >
              <Ionicons name="list-outline" size={24} color={MainColors.pool_water} />
              <Text style={styles.menuItemText}>Задачи</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, isActiveRoute('/projects') && styles.activeMenuItem]}
              onPress={() => handleNavigation('/projects')}
            >
              <Ionicons name="folder-outline" size={24} color={MainColors.pool_water} />
              <Text style={styles.menuItemText}>Проекты</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.settingsItem,
              isActiveRoute('/settings') && styles.activeMenuItem
            ]}
            onPress={() => handleNavigation('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={MainColors.pool_water} />
            <Text style={styles.menuItemText}>Настройки</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: MainColors.pool_water,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    color: TextColors.snowbank,
    fontFamily: 'Century-Regular',
  },
  menuContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  menuItems: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: MainColors.pool_water,
    fontFamily: 'Century-Regular',
  },
  settingsItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  activeMenuItem: {
    backgroundColor: MainColors.herbery_honey,
  },
  image: {
    tintColor: MainColors.pool_water,
    width: 24,
    height: 24
  }
});