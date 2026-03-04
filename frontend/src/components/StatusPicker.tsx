import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MainColors, TextColors } from '@/constants';
import { ProjectStatus } from '@src/types/statuses';

interface StatusPickerProps {
  value: ProjectStatus;
  onChange: (value: ProjectStatus) => void;
  disabled?: boolean;
  error?: string;
}

const statuses: ProjectStatus[] = [
  'В работе',
  'Выполнена',
  'Сдана',
  'Провален',
  'Неактуально',
  'Приостановлен',
  'Черновик'
];

export const StatusPicker: React.FC<StatusPickerProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.option,
              value === status && styles.selectedOption,
              disabled && styles.disabled,
            ]}
            onPress={() => !disabled && onChange(status)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionText,
                value === status && styles.selectedOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
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
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    backgroundColor: MainColors.white,
  },
  selectedOption: {
    backgroundColor: MainColors.pool_water,
  },
  optionText: {
    fontSize: 14,
    color: MainColors.pool_water,
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