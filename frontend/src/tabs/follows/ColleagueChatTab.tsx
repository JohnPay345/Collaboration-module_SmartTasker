import { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useGetOrCreateChat, useChatMessages, useSendMessage, type ChatMessage } from '@src/api/chat';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { getChatMessagesStream } from '@src/services/chatWebSocket';
import { MainColors, TextColors } from '@/constants';

interface ColleagueChatTabProps {
  peerId?: string;
}

export const ColleagueChatTab: React.FC<ColleagueChatTabProps> = ({ peerId }) => {
  const currentUserId = useCurrentUserId();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const { data: chatData, isLoading: chatLoading, isSuccess: chatReady } = useGetOrCreateChat(currentUserId ?? null, peerId ?? null);
  const chatId = chatData?.chat_id ?? null;

  const { data: initialMessages = [], isLoading: messagesLoading } = useChatMessages(currentUserId, chatId, 0);

  const sendMessage = useSendMessage(currentUserId, chatId ?? null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!chatId) return;
    const sub = getChatMessagesStream(chatId).subscribe((newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.chat_messages_id === newMsg.chat_messages_id)) return prev;
        return [...prev, newMsg];
      });
    });
    return () => sub.unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sendMessage.isPending || !chatId) return;
    setInputText('');
    try {
      const newMsg = await sendMessage.mutateAsync(text);
      setMessages((prev) => {
        if (prev.some((m) => m.chat_messages_id === newMsg.chat_messages_id)) return prev;
        return [...prev, newMsg];
      });
    } catch {
      // error already handled by mutation
    }
  };

  if (!peerId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Выберите коллегу для чата</Text>
      </View>
    );
  }

  if (chatLoading || !chatReady || messagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TextColors.lunar_base} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <Text style={styles.hint}>Пока нет сообщений. Напишите первым.</Text>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === currentUserId;
          return (
            <View
              key={msg.chat_messages_id}
              style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubblePeer]}
            >
              <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextPeer]}>
                {msg.message_text}
              </Text>
              <Text style={styles.time}>
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.send_message}>
        <TextInput
          style={styles.text_input}
          placeholder="Введите сообщение"
          placeholderTextColor={TextColors.lunar_base}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={!sendMessage.isPending}
        />
        <TouchableOpacity
          style={[styles.send_button, sendMessage.isPending && styles.send_button_disabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessage.isPending}
        >
          <Text style={styles.send_button_text}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  hint: {
    color: TextColors.lunar_base,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: MainColors.herbery_honey,
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    alignSelf: 'flex-start',
    backgroundColor: MainColors.snowbank ?? '#e9e9e9',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
  },
  bubbleTextOwn: {
    color: TextColors.lunar_base,
  },
  bubbleTextPeer: {
    color: TextColors.dire_wolf ?? '#333',
  },
  time: {
    fontSize: 11,
    color: TextColors.lunar_base,
    marginTop: 4,
  },
  send_message: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: TextColors.dim_gray,
    backgroundColor: MainColors.white,
  },
  text_input: {
    flex: 1,
    borderWidth: 1,
    borderColor: TextColors.dim_gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  send_button: {
    backgroundColor: MainColors.herbery_honey,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  send_button_disabled: {
    opacity: 0.6,
  },
  send_button_text: {
    color: TextColors.lunar_base,
    fontWeight: '600',
  },
});
