import { ProjectScreen } from '@/src/screens/ProjectScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ProjectsScreenId() {
  const { project_id } = useLocalSearchParams();
  return <ProjectScreen projectId={project_id?.toString()} />;
} 