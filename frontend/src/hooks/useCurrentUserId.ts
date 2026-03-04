import { useQuery } from '@tanstack/react-query';
import { getCurrentUserId } from '@src/services/chatWebSocket';
import { useAuth } from '@src/hooks/useAuth';

export function useCurrentUserId(): string | null {
  const { isAuthenticated } = useAuth();
  const { data: userId } = useQuery({
    queryKey: ['currentUserId'],
    queryFn: getCurrentUserId,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
  return userId ?? null;
}
