import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { MainColors, TextColors } from '@/constants';
import { Project } from '@src/api/projects';
import { pickCell, type LwwCell } from '@src/collab/lwwMaterialize';
import type { User } from '@src/api/users';
import { StatusPicker } from '@src/components/StatusPicker';
import { FieldErrors, UseFormSetValue, Control, Controller } from 'react-hook-form';
import { ProjectFormData } from '@src/schemas/project.schema';
import { ModalItem } from '@src/components/ModalItem';
import { Tags } from '@src/components/Tags';

export type ProjectCollaboration = {
  materialized: Record<string, LwwCell>;
  pushWrite: (field: string, value: unknown) => void;
};

function formatColleagueName(u: Pick<User, 'first_name' | 'middle_name' | 'last_name'>) {
  return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ').trim();
}

interface ProjectInfoTabProps {
  project: Project | undefined;
  isEditable: boolean;
  isVisible: boolean;
  changeVisible: (newState: boolean) => void;
  onDeleteProject: (projectId: string) => void;
  errors: FieldErrors<ProjectFormData>;
  control: Control<ProjectFormData>;
  setValue: UseFormSetValue<ProjectFormData>;
  collaboration?: ProjectCollaboration;
  assignmentUserIds: string[];
  onAssignmentUserIdsChange: (ids: string[]) => void;
  colleagues: User[];
  activeEditorsByField?: Record<string, string[]>;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
  project,
  isEditable,
  onDeleteProject,
  isVisible,
  changeVisible,
  errors,
  control,
  setValue,
  collaboration,
  assignmentUserIds,
  onAssignmentUserIdsChange,
  colleagues,
  activeEditorsByField,
}) => {
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);

  const assignmentSummary = useMemo(() => {
    if (!assignmentUserIds.length) return 'Не выбраны';
    return assignmentUserIds
      .map((id) => colleagues.find((c) => c.user_id === id))
      .filter(Boolean)
      .map((u) => formatColleagueName(u!))
      .join(', ');
  }, [assignmentUserIds, colleagues]);

  const toggleAssignment = useCallback(
    (uid: string) => {
      const next = assignmentUserIds.includes(uid)
        ? assignmentUserIds.filter((x) => x !== uid)
        : [...assignmentUserIds, uid];
      onAssignmentUserIdsChange(next);
    },
    [assignmentUserIds, onAssignmentUserIdsChange]
  );
  /*const [currentTag, setCurrentTag] = useState('');
  const [tagsList, setTagsList] = useState(project?.tags ?? []);*/

  const setValueTags = (field: string, postTags: string) => {
    setValue('tags', postTags);
    if (collaboration) {
      const cleaned = postTags.replace(/^\{|\}$/g, '');
      const list = cleaned
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      collaboration.pushWrite('tags', list);
    }
  }

  const renderEditorHint = (fieldKey: string) => {
    if (!isEditable) return null;
    const list = activeEditorsByField?.[fieldKey] ?? [];
    if (!list.length) return null;
    const max = 3;
    const shown = list.slice(0, max);
    const rest = list.length - shown.length;
    const text =
      shown.length === 1
        ? `Сейчас редактирует: ${shown[0]}`
        : rest > 0
          ? `Сейчас редактируют: ${shown.join(', ')} и ещё ${rest}`
          : `Сейчас редактируют: ${shown.join(', ')}`;
    return <Text style={styles.editorHint}>{text}</Text>;
  };

  /*const handleAddTag = () => {
    if (currentTag.trim() !== '' && !tagsList.includes(currentTag.trim())) {
      let newTagsList = [...tagsList, currentTag.trim()];
      setTagsList(newTagsList);
      setValue('tags', `{${newTagsList.toString()}}`);
      setCurrentTag(''); // Очищаем поле ввода после добавления
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTagsList(tagsList.filter(tag => tag !== tagToRemove));
  };*/

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Название проекта</Text>
        {renderEditorHint('project_name')}
        <Controller
          name={"project_name"}
          control={control}
          render={({field: {onChange, onBlur, value}}) => (
            <TextInput
              style={[styles.input, errors.project_name && styles.inputError]}
              value={pickCell(collaboration?.materialized ?? {}, 'project_name', value)}
              onChangeText={(t) => {
                onChange(t);
                collaboration?.pushWrite('project_name', t);
              }}
              placeholder="Введите название проекта"
              editable={isEditable}
              placeholderTextColor={TextColors.dim_gray}
            />
          )}
        />

        {errors.project_name && (
          <Text style={styles.errorText}>{errors.project_name.message}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Описание</Text>
        {renderEditorHint('description')}
        <Controller
          name={'description'}
          control={control}
          render={({field: {onChange, onBlur, value}}) => (
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={pickCell(collaboration?.materialized ?? {}, 'description', value)}
              onChangeText={(t) => {
                onChange(t);
                collaboration?.pushWrite('description', t);
              }}
              placeholder="Введите описание проекта"
              multiline
              numberOfLines={4}
              editable={isEditable}
              placeholderTextColor={TextColors.dim_gray}
            />
          )}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description.message}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Статус</Text>
        {renderEditorHint('status')}
        <Controller
          name={"status"}
          control={control}
          render={({field: {onChange, onBlur, value}}) => (
            <StatusPicker
              value={pickCell(collaboration?.materialized ?? {}, 'status', value) as ProjectFormData['status']}
              onChange={(s) => {
                onChange(s);
                collaboration?.pushWrite('status', s);
              }}
              disabled={!isEditable}
              error={errors.status?.message}
            />
          )}
        />
      </View>

      {/*<View style={styles.section}>
        <Text style={styles.label}>Теги</Text>
        <View style={styles.inputContainer}>
          {tagsList.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagCloseButton}>
                <Text style={styles.tagCloseText}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            style={styles.textInput}
            value={currentTag}
            onChangeText={setCurrentTag}
            placeholder="Добавить тег..."
            onSubmitEditing={handleAddTag} // Для Android, когда клавиатура "Enter"
            returnKeyType="done" // Для iOS, кнопка "Done" на клавиатуре
            blurOnSubmit={false} // Чтобы клавиатура не скрывалась после onSubmitEditing, если нужно ввести несколько тегов
          />
        </View>
      </View>*/}
      {/*{renderEditorHint('tags')}*/}
      <Controller
        name={"tags"}
        control={control}
        render={({field: {onChange, onBlur, value}}) => {
          let tagsFromCell = pickCell(collaboration?.materialized ?? {}, 'tags', value) as ProjectFormData['tags'];
          tagsFromCell = Array.isArray(tagsFromCell) ? tagsFromCell : tagsFromCell.split(',');
          return (
            <Tags
              title={"Теги"}
              field={"tags"}
              setValue={setValueTags}
              tagsFromAPI={tagsFromCell}
              renderEditorHint={renderEditorHint}
            />
          )
        }}
      />
      {/*<Tags
        title={"Теги"}
        field={"tags"}
        setValue={setValueTags}
        tagsFromAPI={project?.tags}
      />*/}

      <View style={styles.section}>
        <Text style={styles.label}>Команда проекта</Text>
        <View style={[styles.input, { padding: 12 }]}>
          <Text style={{ color: TextColors.dim_gray, fontFamily: 'Century-Regular' }}>{assignmentSummary}</Text>
        </View>
        {isEditable && colleagues.length > 0 ? (
          <TouchableOpacity
            style={[styles.addTagButton, { marginTop: 10 }]}
            onPress={() => setTeamPickerVisible(true)}
          >
            <Text style={styles.addTagText}>Выбрать участников</Text>
          </TouchableOpacity>
        ) : isEditable ? (
          <Text style={{ marginTop: 8, color: TextColors.lunar_base }}>Нет коллег в списке</Text>
        ) : null}
      </View>

      <ModalItem isVisible={teamPickerVisible} onClose={() => setTeamPickerVisible(false)}>
        <Text style={[styles.label, { marginBottom: 12 }]}>Участники</Text>
        {colleagues.map((c) => {
          const selected = assignmentUserIds.includes(c.user_id);
          return (
            <TouchableOpacity
              key={c.user_id}
              onPress={() => toggleAssignment(c.user_id)}
              style={[
                styles.teamRow,
                { backgroundColor: selected ? MainColors.pool_water : MainColors.pixel_white },
              ]}
            >
              <Text style={{ color: selected ? MainColors.white : TextColors.dim_gray }}>
                {formatColleagueName(c)} {selected ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ModalItem>

      <View style={styles.section}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => changeVisible(true)}>
          <Text style={styles.deleteText}>Удалить проект</Text>
        </TouchableOpacity>
        <ModalItem isVisible={isVisible} onClose={() => changeVisible(false)}>
          <Text style={styles.title}>Сообщение</Text>
          <Text style={styles.message}>Удалить проект?</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => changeVisible(false)}>
              <Text style={styles.cancelButtonText}>Нет</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={() => {
                if (project?.project_id) onDeleteProject(project.project_id);
              }}
            >
              <Text style={styles.confirmButtonText}>Да</Text>
            </TouchableOpacity>
          </View>
        </ModalItem>
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
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
  },
  textArea: {
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Century-Regular',
    color: TextColors.dim_gray,
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
  editorHint: {
    fontSize: 12,
    color: TextColors.dim_gray,
    fontFamily: 'Century-Regular',
    marginBottom: 6,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row', // Чтобы теги располагались в строку
    flexWrap: 'wrap',     // И переносились на новую строку
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    minHeight: 50,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  tagText: {
    marginRight: 5,
  },
  tagCloseButton: {
    marginLeft: 5,
    padding: 2,
  },
  tagCloseText: {
    color: '#555',
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1, // Чтобы TextInput занимал оставшееся место
    minHeight: 40, // Чтобы TextInput был достаточно высоким
    paddingHorizontal: 5,
  },
  addTagButton: {
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addTagText: {
    color: MainColors.pool_water,
    fontSize: 16,
    fontFamily: 'Century-Regular'
  },
  teamRow: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: MainColors.scarlet,
    borderRadius: 5,
  },
  deleteText: {
    color: TextColors.ottoman_red,
    fontFamily: 'Century-Regular',
    textAlign: 'center',
  },
  dialogBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%', // Ширина диалогового окна
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Для Android
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: TextColors.lunar_base, // Пример использования цветовой константы
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: TextColors.dim_gray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Размещаем кнопки с пространством
    width: '100%',
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1, // Чтобы кнопки занимали равное пространство
    marginHorizontal: 5, // Небольшой отступ между кнопками
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0', // Светло-серый
  },
  cancelButtonText: {
    color: TextColors.dim_gray,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#007bff', // Синий цвет
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});