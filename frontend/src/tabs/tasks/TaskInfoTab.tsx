import { GetTaskStatusColor, MainColors, TextColors } from "@/constants";
import { ModalItem } from "@/src/components/ModalItem";
import { TaskStatus } from "@/src/types/statuses";
import { Octicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const STATUSES: TaskStatus[] = ['Черновик', 'В работе', 'Сдана', 'Выполнена', 'Неактуально', 'Провален'];
const PRIORITIES = ['1 - Низкий', '2 - Средний', '3 - Высокий'];
const VALUES = ['1 - Низкая', '2 - Средняя', '3 - Высокая'];

function calcPriority(value: string, effort: string): string {
  const v = parseInt(value.split(' ')[0], 10);
  const e = parseInt(effort.split(' ')[0], 10);
  const score = v - e;
  if (score >= 2) return PRIORITIES[2];
  if (score === 1) return PRIORITIES[1];
  return PRIORITIES[0];
}

export const TaskInfoTab = ({ mode }: { mode: 'create' | 'view' | 'edit' }) => {
  const [isStatusPickerVisible, setIsStatusPickerVisible] = useState(false);
  const isEditable = mode === 'create' || mode === 'edit';
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    author: 'Вы, Винокурин Геннадий Павлович',
    deadline: '01.01.2000, 09:30',
    status: 'В работе' as TaskStatus,
    value: '3 - Высокий',
    effort: '3 - Высокий',
    skills: 'Администрирование ОС; Сетевые технологии; Облач...',
    assignees: 'Иванов И.И.; Горький С.Я.;',
    urgent: false,
  });

  const priority = calcPriority(taskData.value, taskData.effort);

  const renderPicker = (value: string, items: string[], onValueChange: (value: string) => void) => (
    <View style={styles.infoField}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        enabled={isEditable}
        style={styles.picker}
      >
        {items.map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
      </Picker>
    </View>
  );

  let isVisible = false;

  const showPicker = <T extends string>(value: T, items: T[], onValueChange: (value: T) => void) => {
    return (
      <ModalItem
        isVisible={true}
        onClose={() => !isVisible}
      >
        <View style={styles.pickerContainer}>
          <Picker selectedValue={value} onValueChange={onValueChange} enabled={isEditable} style={styles.picker}>
            {items.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      </ModalItem>
    );
  };

  const getStatusTextColor = (status: TaskStatus): string => {
    if (status === 'Выполнена'
      || status === 'В работе'
    ) {
      return TextColors.dire_wolf;
    }
    return TextColors.snowbank;
  }

  const getStatusColor = (status: TaskStatus): string => {
    const color = GetTaskStatusColor[status] ? GetTaskStatusColor[status] : TextColors.dim_gray;
    return color;
  }

  const handleDelete = () => {
    // TODO: Удаление задачи
    router.back();
  };

  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Название задачи</Text>
        <TextInput
          style={styles.input}
          placeholder="До 200 символов"
          value={taskData.title}
          onChangeText={(text) => setTaskData({ ...taskData, title: text })}
          editable={isEditable}
          maxLength={200}
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          multiline
          placeholder="Описание задачи"
          value={taskData.description}
          onChangeText={(text) => setTaskData({ ...taskData, description: text })}
          editable={isEditable}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Автор</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoText}>{taskData.author}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>Дедлайн</Text>
          <View style={[styles.infoField, { borderRadius: 0, backgroundColor: 'transparent' }]}>
            <Text style={[styles.infoText, { fontSize: 12 }]}>{taskData.deadline}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>Статус задачи</Text>
          <TouchableOpacity
            style={[styles.statusBadge, {
              backgroundColor: getStatusColor(taskData.status)
            }]}
            onPress={() => { setIsStatusPickerVisible(true) }}
          >
            <Text style={[styles.statusText, { color: getStatusTextColor(taskData.status) }]}>
              {taskData.status}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>{taskData.urgent ? 'Срочно' : 'Не срочно'}</Text>
          <View style={[styles.urgencyIcon, { alignItems: 'center' }]}>
            <Octicons name="stop" size={35} color={taskData.urgent ? TextColors.ottoman_red : TextColors.dim_gray} />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>Приоритет</Text>
          <View style={styles.infoField}>
            <Text style={styles.infoText}>{priority}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>Ценность</Text>
          {isEditable ? (
            renderPicker(
              taskData.value,
              VALUES,
              (value) => setTaskData({ ...taskData, value })
            )
          ) : (
            <View style={styles.infoField}>
              <Text style={styles.infoText}>{taskData.value}</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: 'center' }]}>Усилия</Text>
          {isEditable ? (
            renderPicker(
              taskData.effort,
              VALUES,
              (effort) => setTaskData({ ...taskData, effort })
            )
          ) : (
            <View style={styles.infoField}>
              <Text style={styles.infoText}>{taskData.effort}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Оценка срока</Text>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
        </View>
        <View style={styles.timelineLabels}>
          <Text style={styles.timelineLabel}>Пессимистичная</Text>
          <Text style={styles.timelineLabel}>Оптимистичная</Text>
          <Text style={styles.timelineLabel}>Ближайший срок</Text>
          <Text style={styles.timelineLabel}>Средняя</Text>
          <Text style={styles.timelineLabel}>Нежелательно</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Необходимые навыки</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoText}>{taskData.skills}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.assignButton}>
        <Text style={styles.assignButtonText}>Поручить задачу</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>Поручена задача 2 исполнителям</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoText}>{taskData.assignees}</Text>
        </View>
      </View>

      <View style={[styles.section, mode == 'create' && { marginBottom: 40 }]}>
        <Text style={styles.label}>Проекты</Text>
        <TouchableOpacity style={styles.addProjectButton}>
          <Text style={styles.addProjectButtonText}>Добавить</Text>
        </TouchableOpacity>
        <View style={styles.noProjectsContainer}>
          <Text style={styles.noProjectsText}>Нет проектов</Text>
        </View>
      </View>

      {mode !== 'create' && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Удалить</Text>
        </TouchableOpacity>
      )}

      {/* Все модальные окна */}
      <ModalItem
        isVisible={isStatusPickerVisible}
        onClose={() => { setIsStatusPickerVisible(false) }}
      >
        {STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => { setTaskData({ ...taskData, status }); setIsStatusPickerVisible(false) }}
            style={[styles.modalItem, { backgroundColor: getStatusColor(status) }]}
          >
            <Text style={{ color: getStatusTextColor(status), fontFamily: 'Century-Regular' }}>{status}</Text>
          </TouchableOpacity>
        ))}
      </ModalItem>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  input: {
    fontSize: 16,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  pickerContainer: {
    overflow: 'hidden',
  },
  picker: {
    color: TextColors.dire_wolf,
  },
  infoField: {
    padding: 8,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
    marginHorizontal: 4,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Century-Regular',
  },
  urgencyIcon: {
    alignItems: 'center',
  },
  timelineContainer: {
    height: 2,
    backgroundColor: TextColors.dim_gray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TextColors.dim_gray,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: TextColors.dim_gray,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timelineLabel: {
    fontSize: 10,
    color: TextColors.dim_gray,
    textAlign: 'center',
    flex: 1,
    fontFamily: 'Century-Regular',
  },
  assignButton: {
    width: 180,
    backgroundColor: MainColors.herbery_honey,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  assignButtonText: {
    color: TextColors.dire_wolf,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  addProjectButton: {
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  addProjectButtonText: {
    color: MainColors.pool_water,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  noProjectsContainer: {
    padding: 16,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
    alignItems: 'center',
  },
  noProjectsText: {
    color: TextColors.dim_gray,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  deleteButton: {
    width: 150,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: TextColors.ottoman_red,
  },
  deleteButtonText: {
    color: TextColors.ottoman_red,
    fontSize: 16,
    fontFamily: 'Century-Regular',
  },
  modalItem: {
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
});