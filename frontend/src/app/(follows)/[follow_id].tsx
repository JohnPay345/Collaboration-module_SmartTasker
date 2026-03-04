import { useLocalSearchParams } from 'expo-router';
import { FollowScreen } from '@src/screens/FollowScreen'

export default function FollowScreenId() {
  const { follow_id } = useLocalSearchParams();

  return <FollowScreen follow_id={follow_id?.toString()} />;
}