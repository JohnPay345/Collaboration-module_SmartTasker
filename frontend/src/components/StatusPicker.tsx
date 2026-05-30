import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GetProjectStatusColor, MainColors, TextColors } from '@/constants';
import { ProjectStatus } from '@src/types/statuses';
import { backgroundColor } from 'react-native-calendars/src/style'

interface StatusPickerProps {
  value: ProjectStatus;
  onChange: (value: ProjectStatus) => void;
  disabled?: boolean;
  error?: string;
}

const statuses: ProjectStatus[] = [
  'В работе',
  'Выполнена',
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
  // TODO: Можно выделить отдельно для переиспользования
  const getStatusColorText = (status: string) => {
    if (status === 'Выполнена'
      || status === 'В работе'
    ) {
      return TextColors.dire_wolf;
    }
    return TextColors.snowbank;
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.option,
              value == status ? {backgroundColor: GetProjectStatusColor[status],
                  borderColor: GetProjectStatusColor[status]} :
                {borderColor: GetProjectStatusColor[status]},
              disabled && styles.disabled,
            ]}
            onPress={() => !disabled && onChange(status)}
            disabled={disabled}
          >
            <Text
              style={[
                value == status && {color: getStatusColorText(status)},
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