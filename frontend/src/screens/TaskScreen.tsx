import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { MainColors, TextColors } from '@/constants';
import { router } from 'expo-router';
import { Tab, TabsComponent } from '@/src/components/TabsComponent';
import { TaskInfoTab } from '@/src/tabs/tasks/TaskInfoTab';
import { TaskDescriptionTab } from '@/src/tabs/tasks/TaskDescriptionTab';

type TaskMode = 'create' | 'view' | 'edit';

interface TaskScreenProps {
  taskId?: string;
}

export const TaskScreen: React.FC<TaskScreenProps> = ({ taskId }) => {
  const [mode, setMode] = useState<TaskMode>(taskId ? 'view' : 'create');

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    // TODO: Сохранение задачи
    router.back();
  };

  const handleEdit = () => {
    setMode('edit');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={handleBack}>
            <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Задача</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={35} color={MainColors.pool_water} />
          </TouchableOpacity>
        </View>
      </View>
      <TabsComponent
        activeTab={0}
        onTabChange={(index) => { }}
      >
        <Tab
          label="Свойства"
        >
          <TaskInfoTab mode={mode} />
        </Tab>
        <Tab
          label="Описание"
        >
          <TaskDescriptionTab />
        </Tab>
      </TabsComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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