import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MainColors, TextColors } from '@/constants';

interface ProjectGoalsTabProps {
  projectId: string;
}

export const ProjectGoalsTab: React.FC<ProjectGoalsTabProps> = ({ projectId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Цели проекта {projectId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: MainColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: TextColors.dire_wolf,
  },
});