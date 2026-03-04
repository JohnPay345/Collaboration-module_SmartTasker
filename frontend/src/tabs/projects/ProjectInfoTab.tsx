import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { TextColors } from '@/constants';
import { Project } from '@src/api/projects';
import { StatusPicker } from '@src/components/StatusPicker';
import { FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ProjectFormData } from '@src/schemas/project.schema';

interface ProjectInfoTabProps {
  project: Project | undefined;
  isEditable: boolean;
  errors: FieldErrors<ProjectFormData>;
  setValue: UseFormSetValue<ProjectFormData>;
  watch: UseFormWatch<ProjectFormData>;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
  project,
  isEditable,
  errors,
  setValue,
  watch,
}) => {
  const projectName = watch('project_name');
  const description = watch('description');
  const status = watch('status');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Название проекта</Text>
        <TextInput
          style={[styles.input, errors.project_name && styles.inputError]}
          value={projectName}
          onChangeText={(value) => setValue('project_name', value)}
          placeholder="Введите название проекта"
          editable={isEditable}
          placeholderTextColor={TextColors.dim_gray}
        />
        {errors.project_name && (
          <Text style={styles.errorText}>{errors.project_name.message}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={description}
          onChangeText={(value) => setValue('description', value)}
          placeholder="Введите описание проекта"
          multiline
          numberOfLines={4}
          editable={isEditable}
          placeholderTextColor={TextColors.dim_gray}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description.message}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Статус</Text>
        <StatusPicker
          value={status}
          onChange={(value) => setValue('status', value)}
          disabled={!isEditable}
          error={errors.status?.message}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TextColors.dim_gray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: TextColors.dim_gray,
  },
  textArea: {
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: TextColors.dire_wolf,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: TextColors.ottoman_red,
  },
  errorText: {
    color: TextColors.ottoman_red,
    fontSize: 14,
    marginTop: 4,
  },
});