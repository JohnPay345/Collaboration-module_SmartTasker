import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/axios';
import { handleApiError } from '@src/services/errors';

const MESSAGES_PAGE_SIZE = 50;

export interface ChatMessage {
  chat_messages_id: string;
  chat_id: string;
  user_id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  code: number;
  url: string;
  message: { chat_id: string };
}

export interface MessagesResponse {
  code: number;
  url: string;
  message: ChatMessage[];
}

export function useGetOrCreateChat(userId: string | null, peerId: string | null) {
  return useQuery({
    queryKey: ['chat', 'with', userId, peerId],
    queryFn: async (): Promise<{ chat_id: string }> => {
      if (!userId || !peerId) throw new Error('userId and peerId required');
      const { data } = await api.get<ChatResponse>(`/api/chats/${userId}/with/${peerId}`);
      return data.message as { chat_id: string };
    },
    enabled: !!userId && !!peerId,
  });
}

export function useChatMessages(userId: string | null, chatId: string | null, page = 0) {
  const offset = page * MESSAGES_PAGE_SIZE;
  return useQuery({
    queryKey: ['chat', 'messages', chatId, offset],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!userId || !chatId) throw new Error('userId and chatId required');
      const { data } = await api.get<MessagesResponse>(
        `/api/chats/${userId}/${chatId}/messages?limit=${MESSAGES_PAGE_SIZE}&offset=${offset}`
      );
      return data.message ?? [];
    },
    enabled: !!userId && !!chatId,
  });
}

export function useSendMessage(userId: string | null, chatId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageText: string) => {
      if (!userId || !chatId) throw new Error('userId and chatId required');
      const { data } = await api.post<{ code: number; message: ChatMessage }>(
        `/api/chats/${userId}/${chatId}/messages`,
        { data: { message_text: messageText } }
      );
      return data.message as ChatMessage;
    },
    onSuccess: (_, __, context) => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', chatId] });
      }
    },
    onError: handleApiError,
  });
}
