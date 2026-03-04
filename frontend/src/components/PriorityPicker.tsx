import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MainColors, TextColors } from '@/constants';

type Priority = 'Низкий' | 'Средний' | 'Высокий';

interface PriorityPickerProps {
  value: Priority;
  onChange: (value: Priority) => void;
  disabled?: boolean;
  error?: string;
}

const priorities: Priority[] = ['Низкий', 'Средний', 'Высокий'];

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'Низкий':
      return TextColors.beer;
    case 'Средний':
      return TextColors.pool_water;
    case 'Высокий':
      return TextColors.ottoman_red;
    default:
      return MainColors.pool_water;
  }
};

export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {priorities.map((priority) => {
          const color = getPriorityColor(priority);
          return (
            <TouchableOpacity
              key={priority}
              style={[
                styles.option,
                { borderColor: color },
                value === priority && { backgroundColor: color },
                disabled && styles.disabled,
              ]}
              onPress={() => !disabled && onChange(priority)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.optionText,
                  { color },
                  value === priority && styles.selectedOptionText,
                  disabled && styles.disabledText,
                ]}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: MainColors.white,
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: MainColors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: TextColors.dim_gray,
  },
  errorText: {
    color: TextColors.ottoman_red,
    fontSize: 14,
    marginTop: 4,
  },
}); 