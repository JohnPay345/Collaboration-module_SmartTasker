import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { MainColors, TextColors } from '@/constants';

interface ProjectTasksTabProps {
  projectId: string;
}

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ projectId }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.text}>Список задач проекта {projectId}</Text>
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
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});