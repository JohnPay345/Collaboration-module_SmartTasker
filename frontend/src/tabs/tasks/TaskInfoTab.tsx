import { GetTaskStatusColor, MainColors, TextColors } from "@/constants";
import { ModalItem } from "@/src/components/ModalItem";
import { Tags } from "@/src/components/Tags";
import { DurationSlider } from "@/src/components/DurationSlider";
import { DatePickerProfile } from "@/src/modals/DatePickerProfile";
import { TaskStatus } from "@/src/types/statuses";
import {
  RATING_PICKER_ITEMS,
  ratingLabel,
  toRatingLevel,
  type TaskRatingLevel,
} from "@/src/utils/taskRatings";
import { Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Task } from "@src/api/tasks";
import { pickCell, type LwwCell } from "@src/collab/lwwMaterialize";
import type { User } from "@src/api/users";

export type TaskInfoTabSavePayload = {
  task: Record<string, unknown>;
  assignmentUserIds: string[];
};

export type TaskInfoTabRef = {
  getSavePayload: () => TaskInfoTabSavePayload;
};

function formatColleagueName(u: Pick<User, "first_name" | "middle_name" | "last_name">) {
  return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ").trim();
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("ru-RU");
}

function toCalendarMaxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type TaskCollaboration = {
  materialized: Record<string, LwwCell>;
  pushWrite: (field: string, value: unknown) => void;
};

const STATUSES: TaskStatus[] = ["Черновик", "В работе", "Сдана", "Выполнена", "Неактуально", "Провален"];
type RatingField = "priority" | "value" | "effort";

export const TaskInfoTab = forwardRef<
  TaskInfoTabRef,
  {
    mode: "create" | "view" | "edit";
    task?: Task | null;
    collaboration?: TaskCollaboration;
    colleagues?: User[];
    currentUserId: string;
    activeEditorsByField?: Record<string, string[]>;
  }
>(function TaskInfoTab({ mode, task, collaboration, colleagues = [], currentUserId, activeEditorsByField }, ref) {
  const [isStatusPickerVisible, setIsStatusPickerVisible] = useState(false);
  const [ratingPicker, setRatingPicker] = useState<RatingField | null>(null);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const isEditable = mode === "create" || mode === "edit";

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    author: "",
    status: "В работе" as TaskStatus,
    priority: "3" as TaskRatingLevel,
    value: "3" as TaskRatingLevel,
    effort: "3" as TaskRatingLevel,
    urgent: false,
  });

  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 7 * 86400000));
  const [estimatedDuration, setEstimatedDuration] = useState(8);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [assignmentUserIds, setAssignmentUserIds] = useState<string[]>([]);
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTaskData((prev) => ({
      ...prev,
      title: task.task_name ?? prev.title,
      description: task.description ?? prev.description,
      author: task.author_name ? `Автор: ${task.author_name}` : prev.author,
      status: (task.status as TaskStatus) ?? prev.status,
      priority: toRatingLevel(task.priority, "3"),
      value: toRatingLevel(task.value, "3"),
      effort: toRatingLevel(task.effort, "3"),
      urgent: !!task.is_urgent,
    }));
    if (task.end_date) {
      setEndDate(new Date(task.end_date as Date));
    }
    if (task.estimated_duration != null) {
      setEstimatedDuration(Math.min(40, Math.max(1, Number(task.estimated_duration) || 8)));
    }
    setSkillsList(Array.isArray(task.required_skills) ? task.required_skills.filter(Boolean) : []);
    setAssignmentUserIds(task.assignment_user_ids ?? []);
  }, [task]);

  const cells = collaboration?.materialized ?? {};
  const title = pickCell(cells, "task_name", taskData.title);
  const description = pickCell(cells, "description", taskData.description);
  const status = pickCell(cells, "status", taskData.status) as TaskStatus;
  const priorityLevel = toRatingLevel(pickCell(cells, "priority", taskData.priority) as string);
  const valueLevel = toRatingLevel(pickCell(cells, "value", taskData.value) as string);
  const effortLevel = toRatingLevel(pickCell(cells, "effort", taskData.effort) as string);
  const urgent = pickCell(cells, "is_urgent", taskData.urgent);

  const getStatusTextColor = (s: TaskStatus): string => {
    if (s === "Выполнена" || s === "В работе") {
      return TextColors.dire_wolf;
    }
    return TextColors.snowbank;
  };

  const getStatusColor = (s: TaskStatus): string => {
    return GetTaskStatusColor[s] ? GetTaskStatusColor[s] : TextColors.dim_gray;
  };

  const assignmentSummary = useMemo(() => {
    if (!assignmentUserIds.length) return "Не выбраны";
    const names = assignmentUserIds
      .map((id) => colleagues.find((c) => c.user_id === id))
      .filter(Boolean)
      .map((u) => formatColleagueName(u!));
    return names.length ? names.join(", ") : assignmentUserIds.join(", ");
  }, [assignmentUserIds, colleagues]);

  const toggleAssignment = useCallback((uid: string) => {
    setAssignmentUserIds((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }, []);

  const applyRating = (field: RatingField, level: TaskRatingLevel) => {
    setTaskData((prev) => ({ ...prev, [field]: level }));
    collaboration?.pushWrite(field, level);
    setRatingPicker(null);
  };

  const handleSkillsTags = (_field: string, postTags: string) => {
    const list = postTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setSkillsList(list);
    // Для коллаборации обновляем CRDT тем же ключом, который слушает сервер.
    collaboration?.pushWrite("required_skills", list);
  };

  const handleDeadlineChange = (date: Date) => {
    setEndDate(date);
    collaboration?.pushWrite("end_date", date.toISOString().slice(0, 10));
  };

  const changeShowPicker = (picker: string, isShow: boolean) => {
    if (picker === "Date Picker") {
      setShowDeadlinePicker(isShow);
    }
  };

  const renderRatingField = (field: RatingField, label: string, level: TaskRatingLevel) => (
    <View style={[styles.section, styles.flex1]}>
      <Text style={[styles.label, { textAlign: "center" }]}>{label}</Text>
      {renderEditorHint(field)}
      {isEditable ? (
        <TouchableOpacity style={styles.infoField} onPress={() => setRatingPicker(field)}>
          <Text style={styles.infoText}>{ratingLabel(level)}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.infoField}>
          <Text style={styles.infoText}>{ratingLabel(level)}</Text>
        </View>
      )}
    </View>
  );

  const renderEditorHint = (fieldKey: string) => {
    const list = activeEditorsByField?.[fieldKey] ?? [];
    if (!isEditable || list.length === 0) return null;
    const max = 3;
    const shown = list.slice(0, max);
    const rest = list.length - shown.length;
    const text =
      shown.length === 1
        ? `Сейчас редактирует: ${shown[0]}`
        : rest > 0
          ? `Сейчас редактируют: ${shown.join(", ")} и ещё ${rest}`
          : `Сейчас редактируют: ${shown.join(", ")}`;
    return <Text style={styles.editorHint}>{text}</Text>;
  };

  useImperativeHandle(
    ref,
    () => ({
      getSavePayload: (): TaskInfoTabSavePayload => {
        const now = new Date();
        const start = task?.start_date ? new Date(task.start_date as Date) : now;
        return {
          task: {
            task_name: (title || "").trim() || "Без названия",
            description: description || "",
            author_id: task?.author_id || currentUserId,
            start_date: start.toISOString().slice(0, 10),
            end_date: endDate.toISOString().slice(0, 10),
            status,
            is_urgent: !!urgent,
            priority: priorityLevel,
            value: valueLevel,
            effort: effortLevel,
            estimated_duration: estimatedDuration,
            priority_assessment: task?.priority_assessment ?? Number(priorityLevel),
            qualification_assessment: task?.qualification_assessment ?? 1,
            load_assessment: task?.load_assessment ?? 1,
            required_skills: skillsList,
            created_at: task?.created_at ?? now.toISOString(),
            updated_at: now.toISOString(),
            project_id: task?.project_id,
            goal_id: task?.goal_id,
          },
          assignmentUserIds: [...assignmentUserIds],
        };
      },
    }),
    [
      task,
      title,
      description,
      status,
      urgent,
      priorityLevel,
      valueLevel,
      effortLevel,
      endDate,
      estimatedDuration,
      skillsList,
      assignmentUserIds,
      currentUserId,
    ]
  );

  const handleDelete = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Название задачи</Text>
        {renderEditorHint("task_name")}
        <TextInput
          style={styles.input}
          placeholder="До 200 символов"
          value={title}
          onChangeText={(text) => {
            setTaskData({ ...taskData, title: text });
            collaboration?.pushWrite("task_name", text);
          }}
          editable={isEditable}
          maxLength={200}
        />
        {renderEditorHint("description")}
        <TextInput
          style={[styles.input, styles.multilineInput]}
          multiline
          placeholder="Описание задачи"
          value={description}
          onChangeText={(text) => {
            setTaskData({ ...taskData, description: text });
            collaboration?.pushWrite("description", text);
          }}
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
          <Text style={[styles.label, { textAlign: "center" }]}>Дедлайн</Text>
          {renderEditorHint("end_date")}
          {isEditable ? (
            <TouchableOpacity
              style={styles.infoField}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <Text style={[styles.infoText, { fontSize: 12, textAlign: "center" }]}>
                {formatDisplayDate(endDate)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.infoField, { backgroundColor: "transparent" }]}>
              <Text style={[styles.infoText, { fontSize: 12, textAlign: "center" }]}>
                {formatDisplayDate(endDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: "center" }]}>Статус задачи</Text>
          {renderEditorHint("status")}
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}
            onPress={() => isEditable && setIsStatusPickerVisible(true)}
            disabled={!isEditable}
          >
            <Text style={[styles.statusText, { color: getStatusTextColor(status) }]}>{status}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.flex1]}>
          <Text style={[styles.label, { textAlign: "center" }]}>{urgent ? "Срочно" : "Не срочно"}</Text>
          {renderEditorHint("is_urgent")}
          <TouchableOpacity
            style={[styles.urgencyIcon, { alignItems: "center" }]}
            disabled={!isEditable}
            onPress={() => {
              const next = !Boolean(urgent);
              setTaskData({ ...taskData, urgent: next });
              collaboration?.pushWrite("is_urgent", next);
            }}
          >
            <Octicons
              name="stop"
              size={35}
              color={urgent ? TextColors.ottoman_red : TextColors.dim_gray}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        {renderRatingField("priority", "Приоритет", priorityLevel)}
        {renderRatingField("value", "Ценность", valueLevel)}
        {renderRatingField("effort", "Усилия", effortLevel)}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Оценка срока (длительность)</Text>
        <DurationSlider
          value={estimatedDuration}
          min={1}
          max={5}
          step={1}
          disabled={!isEditable}
          onChange={(hours) => {
            setEstimatedDuration(hours);
            collaboration?.pushWrite("estimated_duration", hours);
          }}
        />
      </View>

      {renderEditorHint("required_skills")}
      <Tags
        key={task?.task_id ?? "new-task"}
        title="Необходимые навыки"
        field="required_skills"
        setValue={handleSkillsTags}
        tagsFromAPI={skillsList}
        editable={isEditable}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Исполнители</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoText}>{assignmentSummary}</Text>
        </View>
        {isEditable && colleagues.length > 0 ? (
          <TouchableOpacity
            style={[styles.assignButton, { marginTop: 8 }]}
            onPress={() => setTeamPickerVisible(true)}
          >
            <Text style={styles.assignButtonText}>Выбрать команду</Text>
          </TouchableOpacity>
        ) : isEditable ? (
          <Text style={[styles.infoText, { marginTop: 6, color: TextColors.lunar_base }]}>
            Нет коллег в списке — добавьте связи в профиле
          </Text>
        ) : null}
      </View>

      <View style={[styles.section, mode === "create" && { marginBottom: 40 }]}>
        <Text style={styles.label}>Проекты</Text>
        <TouchableOpacity style={styles.addProjectButton}>
          <Text style={styles.addProjectButtonText}>Добавить</Text>
        </TouchableOpacity>
        <View style={styles.noProjectsContainer}>
          <Text style={styles.noProjectsText}>Нет проектов</Text>
        </View>
      </View>

      {mode !== "create" && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Удалить</Text>
        </TouchableOpacity>
      )}

      <ModalItem isVisible={isStatusPickerVisible} onClose={() => setIsStatusPickerVisible(false)}>
        {STATUSES.map((nextStatus) => (
          <TouchableOpacity
            key={nextStatus}
            onPress={() => {
              setTaskData({ ...taskData, status: nextStatus });
              collaboration?.pushWrite("status", nextStatus);
              setIsStatusPickerVisible(false);
            }}
            style={[styles.modalItem, { backgroundColor: getStatusColor(nextStatus) }]}
          >
            <Text style={{ color: getStatusTextColor(nextStatus), fontFamily: "Century-Regular" }}>
              {nextStatus}
            </Text>
          </TouchableOpacity>
        ))}
      </ModalItem>

      <ModalItem isVisible={ratingPicker !== null} onClose={() => setRatingPicker(null)}>
        <Text style={[styles.label, { marginBottom: 12, textAlign: "center" }]}>
          {ratingPicker === "priority"
            ? "Приоритет"
            : ratingPicker === "value"
              ? "Ценность"
              : "Усилия"}
        </Text>
        {ratingPicker &&
          RATING_PICKER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => applyRating(ratingPicker, item.value)}
              style={styles.modalItem}
            >
              <Text style={{ fontFamily: "Century-Regular", color: TextColors.dire_wolf }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
      </ModalItem>

      <ModalItem isVisible={teamPickerVisible} onClose={() => setTeamPickerVisible(false)}>
        <Text style={[styles.label, { marginBottom: 12 }]}>Выберите исполнителей</Text>
        {colleagues.map((c) => {
          const selected = assignmentUserIds.includes(c.user_id);
          return (
            <TouchableOpacity
              key={c.user_id}
              onPress={() => toggleAssignment(c.user_id)}
              style={[
                styles.modalItem,
                { backgroundColor: selected ? MainColors.pool_water : MainColors.pixel_white },
              ]}
            >
              <Text style={{ color: selected ? MainColors.white : TextColors.dire_wolf }}>
                {formatColleagueName(c)} {selected ? "✓" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ModalItem>

      <DatePickerProfile
        field="end_date"
        showDatePicker={showDeadlinePicker}
        currentDate={endDate}
        handleDateChange={handleDeadlineChange}
        setShowDatePicker={changeShowPicker}
        minDate={new Date().toISOString().slice(0, 10)}
        maxDate={toCalendarMaxDate()}
      />
    </ScrollView>
  );
});

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
    fontSize: 16,
    fontWeight: '600',
    color: TextColors.lunar_base,
    fontFamily: "Century-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    marginBottom: 20,
    padding: 12,
    fontSize: 16,
    color: TextColors.lunar_base,
    fontFamily: "Century-Regular",
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  infoField: {
    padding: 8,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: "Century-Regular",
  },
  editorHint: {
    fontSize: 12,
    color: TextColors.dim_gray,
    fontFamily: "Century-Regular",
    marginBottom: 6,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
    marginHorizontal: 4,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Century-Regular",
  },
  urgencyIcon: {
    alignItems: "center",
  },
  assignButton: {
    width: '100%',
    backgroundColor: MainColors.herbery_honey,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 20,
  },
  assignButtonText: {
    color: TextColors.dire_wolf,
    fontSize: 16,
    fontFamily: "Century-Regular",
  },
  addProjectButton: {
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 8,
  },
  addProjectButtonText: {
    color: MainColors.pool_water,
    fontSize: 16,
    fontFamily: "Century-Regular",
  },
  noProjectsContainer: {
    padding: 16,
    backgroundColor: MainColors.pixel_white,
    borderRadius: 4,
    alignItems: "center",
  },
  noProjectsText: {
    color: TextColors.dim_gray,
    fontSize: 16,
    fontFamily: "Century-Regular",
  },
  deleteButton: {
    width: '100%',
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: TextColors.ottoman_red,
  },
  deleteButtonText: {
    color: TextColors.ottoman_red,
    fontSize: 16,
    fontFamily: "Century-Regular",
  },
  modalItem: {
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    borderRadius: 5,
  },
});
