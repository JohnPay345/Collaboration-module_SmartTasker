import React, { Children, isValidElement, ReactElement, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { MainColors, TextColors } from '@/constants';

interface TabProps {
  label: string;
  badge?: number;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsComponentProps {
  children: React.ReactNode;
  activeTab?: number;
  onTabChange?: (index: number) => void;
  containerStyle?: any;
  tabBarStyle?: any;
}

export const TabsComponent: React.FC<TabsComponentProps> = ({
  children,
  activeTab = 0,
  onTabChange,
  containerStyle,
  tabBarStyle,
}) => {
  const [activeIndex, setActiveIndex] = useState(activeTab);

  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> => isValidElement(child) && child.type === Tab
  );

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    onTabChange?.(index);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.tabBar, tabBarStyle]}>
        {tabs.map((tab, index) => {
          const isFocused = activeIndex === index;
          const { label, badge } = tab.props;

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => handleTabPress(index)}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
              {isFocused && <View style={styles.activeIndicator} />}
              {badge ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.content}>
        {tabs[activeIndex]?.props.children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: MainColors.white,
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: MainColors.pool_water,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: MainColors.pool_water,
  },
  tabLabel: {
    fontSize: 16,
    color: MainColors.pool_water,
    fontFamily: 'Century-Regular',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: TextColors.snowbank,
    fontFamily: 'Century-Regular',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
    backgroundColor: MainColors.herbery_honey,
  },
  content: {
    flex: 1,
    marginBottom: 56,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: MainColors.herbery_honey,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: MainColors.white,
    fontSize: 12,
    fontFamily: 'Century-Regular',
    fontWeight: '600',
  },
}); 