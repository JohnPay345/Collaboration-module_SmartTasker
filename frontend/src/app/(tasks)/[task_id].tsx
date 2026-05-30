import { TaskScreen } from '@/src/screens/TaskScreen';
import { useLocalSearchParams } from 'expo-router';

export default function TaskScreenId() {
  const { task_id } = useLocalSearchParams();

  return <TaskScreen mode={"edit"} taskId={task_id?.toString()} />;
} 