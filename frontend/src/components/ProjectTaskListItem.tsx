import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MainColors, TextColors } from '@/constants';

interface ProjectTaskListItemProps {
  title: string;
  description?: string;
  deadline: string;
  onPress?: () => void;
}

export const ProjectTaskListItem: React.FC<ProjectTaskListItemProps> = ({
  title,
  description,
  deadline,
  onPress,
}) => {
  const preview = (description ?? '').trim() || 'Без описания';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.deadline}>{deadline}</Text>
      </View>
      <Text style={styles.description} numberOfLines={3}>
        {preview}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MainColors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  deadline: {
    fontSize: 12,
    color: TextColors.beer,
    fontFamily: 'Century-Regular',
    minWidth: 72,
    textAlign: 'right',
  },
  description: {
    fontSize: 13,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
    lineHeight: 18,
  },
});
