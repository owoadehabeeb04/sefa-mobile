import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Toast } from '@/src/components/common/Toast';
import {
  assistantChatQueryKey,
  assistantChatsQueryKey,
  useArchiveAssistantChat,
  useAssistantChat,
  useCancelAssistantMessage,
  useEditAssistantMessage,
  useRegenerateAssistantMessage,
  useRetryAssistantMessage,
} from '@/features/assistant/assistant.hooks';
import { openAssistantSocketSession } from '@/features/assistant/assistant.service';
import type { AssistantMessage } from '@/features/assistant/assistant.types';
import { AssistantMessageBubble } from '@/features/assistant/components/AssistantMessageBubble';

const copyText = async (value: string) => {
  await Clipboard.setStringAsync(value);
  return true;
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const upsertMessage = (messages: AssistantMessage[], nextMessage: AssistantMessage) => {
  if (nextMessage.status === 'superseded') {
    return messages.filter((message) => message.id !== nextMessage.id);
  }

  const index = messages.findIndex((message) => message.id === nextMessage.id);
  if (index === -1) {
    return [...messages, nextMessage].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }

  const updated = [...messages];
  updated[index] = { ...updated[index], ...nextMessage };
  return updated;
};

const buildOptimisticConversation = (content: string, chatId?: string | null): AssistantMessage[] => {
  const now = new Date().toISOString();
  return [
    {
      id: `local-user-${Date.now()}`,
      chatId: chatId || 'new',
      role: 'user',
      content,
      status: 'completed',
      isEdited: false,
      version: 1,
      sources: [],
      retrieval: null,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    },
    {
      id: `local-assistant-${Date.now()}`,
      chatId: chatId || 'new',
      role: 'assistant',
      content: '',
      status: 'queued',
      isEdited: false,
      version: 1,
      sources: [],
      retrieval: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export default function AssistantChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { chatId: routeChatId, seed } = useLocalSearchParams<{ chatId: string; seed?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const sessionRef = useRef<Awaited<ReturnType<typeof openAssistantSocketSession>> | null>(null);
  const composerMirrorRef = useRef('');
  const seededRef = useRef(false);
  const optimisticMessagesRef = useRef<AssistantMessage[]>([]);

  const [activeChatId, setActiveChatId] = useState<string | null>(
    routeChatId && routeChatId !== 'new' ? routeChatId : null,
  );
  const [draft, setDraft] = useState('');
  const [editingMessage, setEditingMessage] = useState<AssistantMessage | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<AssistantMessage[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const { data, isLoading } = useAssistantChat(activeChatId || undefined);
  const editMessage = useEditAssistantMessage(activeChatId || '');
  const regenerateMessage = useRegenerateAssistantMessage(activeChatId || '');
  const retryMessage = useRetryAssistantMessage(activeChatId || '');
  const cancelMessage = useCancelAssistantMessage(activeChatId || '');
  const archiveChat = useArchiveAssistantChat(activeChatId || '');

  useEffect(() => {
    optimisticMessagesRef.current = optimisticMessages;
  }, [optimisticMessages]);

  const applyOptimisticMessages = (nextMessages: AssistantMessage[]) => {
    optimisticMessagesRef.current = nextMessages;
    setOptimisticMessages(nextMessages);
  };

  useEffect(() => {
    setActiveChatId(routeChatId && routeChatId !== 'new' ? routeChatId : null);
    seededRef.current = false;
    setEditingMessage(null);
    setOptimisticMessages([]);
    if (!seed) {
      setDraft('');
      composerMirrorRef.current = '';
    }
  }, [routeChatId, seed]);

  useEffect(() => {
    let cancelled = false;

    openAssistantSocketSession(activeChatId, {
      onEvent: (event) => {
        if (cancelled) return;

        if (event.type === 'chat.created' && event.chat) {
          const nextChatId = event.chat.id || event.chat._id;
          const eventMessages = [event.userMessage, event.assistantMessage].filter(Boolean) as AssistantMessage[];
          const optimisticForChat = (eventMessages.length ? eventMessages : optimisticMessagesRef.current).map((message) => ({
            ...message,
            chatId: nextChatId,
          }));
          setActiveChatId(nextChatId);
          queryClient.setQueryData(assistantChatQueryKey(nextChatId), (previous: any) => ({
            chat: { ...(previous?.chat || {}), ...event.chat },
            messages: optimisticForChat.reduce(
              (acc: AssistantMessage[], message: AssistantMessage) => upsertMessage(acc, message),
              previous?.messages || [],
            ),
          }));
          queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(nextChatId) });
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
          router.replace(`/assistant/${nextChatId}` as any);
          return;
        }

        if (event.type === 'message.saved') {
          const nextChatId = event.chatId || activeChatId;
          if (!nextChatId) return;
          applyOptimisticMessages([]);
          queryClient.setQueryData(assistantChatQueryKey(nextChatId), (previous: any) => ({
            chat: previous?.chat || {
              id: nextChatId,
              title: 'New chat',
              titleSource: 'auto',
              status: 'generating',
              lastMessage: '',
              lastMessageAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            messages: [event.userMessage, event.assistantMessage].filter(Boolean).reduce(
              (acc: AssistantMessage[], message: AssistantMessage) => upsertMessage(acc, message),
              previous?.messages || [],
            ),
          }));
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
          return;
        }

        if ((event.type === 'assistant.delta' || event.type === 'assistant.done') && event.assistantMessageId) {
          const nextChatId = event.chatId || activeChatId;
          if (!nextChatId) return;
          queryClient.setQueryData(assistantChatQueryKey(nextChatId), (previous: any) => {
            if (!previous) return previous;
            const existing = previous.messages.find((message: AssistantMessage) => message.id === event.assistantMessageId);
            if (!existing) return previous;
            return {
              ...previous,
              messages: upsertMessage(previous.messages, {
                ...existing,
                content: event.fullText || existing.content,
                status: event.isFinal ? 'completed' : 'streaming',
                sources: Array.isArray(event.sources) ? event.sources : existing.sources,
                retrieval: event.retrieval ?? existing.retrieval,
                completedAt: event.isFinal ? new Date().toISOString() : existing.completedAt,
                updatedAt: new Date().toISOString(),
              }),
            };
          });

          if (event.type === 'assistant.done') {
            queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(nextChatId) });
            queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
          }
          return;
        }

        if (event.type === 'assistant.cancelled' && event.assistantMessageId) {
          const nextChatId = event.chatId || activeChatId;
          if (!nextChatId) return;
          queryClient.setQueryData(assistantChatQueryKey(nextChatId), (previous: any) => {
            if (!previous) return previous;
            const existing = previous.messages.find((message: AssistantMessage) => message.id === event.assistantMessageId);
            if (!existing) return previous;
            return {
              ...previous,
              messages: upsertMessage(previous.messages, {
                ...existing,
                status: 'cancelled',
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
            };
          });
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
          return;
        }

        if (event.type === 'assistant.error') {
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
          setToast({ visible: true, message: event.message || 'Assistant request failed', type: 'error' });
        }
      },
      onError: (error) => {
        if (cancelled) return;
        setToast({ visible: true, message: error.message, type: 'error' });
      },
    }).then((session) => {
      if (cancelled) { session.close(); return; }
      sessionRef.current = session;
      session.startSession({ chatId: activeChatId });
    });

    return () => {
      cancelled = true;
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, [activeChatId, queryClient, router]);

  useEffect(() => {
    const seedText = typeof seed === 'string' ? seed.trim() : '';
    if (!seedText || seededRef.current) return;
    seededRef.current = true;
    setEditingMessage(null);
    applyOptimisticMessages([]);
    setDraft(seedText);
    composerMirrorRef.current = seedText;
  }, [seed]);

  const messages = useMemo(() => data?.messages || [], [data?.messages]);
  const displayMessages = useMemo(() => {
    if (!optimisticMessages.length) return messages;
    return [...messages, ...optimisticMessages].reduce((acc: AssistantMessage[], message) => {
      return upsertMessage(acc, message);
    }, []);
  }, [messages, optimisticMessages]);

  const hasGenerating = displayMessages.some((message) =>
    ['queued', 'generating', 'streaming'].includes(message.status),
  );
  const isMessageActionPending =
    editMessage.isPending || regenerateMessage.isPending || retryMessage.isPending || cancelMessage.isPending;

  const chat = data?.chat || {
    id: activeChatId || 'new',
    title: 'New chat',
    titleSource: 'auto' as const,
    status: 'idle' as const,
    lastMessage: '',
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (!displayMessages.length) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [displayMessages]);

  const handleSubmit = async () => {
    const content = draft.trim();
    if (!content || hasGenerating) return;

    try {
      if (editingMessage) {
        await editMessage.mutateAsync({ messageId: editingMessage.id, content });
        setEditingMessage(null);
      } else {
        applyOptimisticMessages(buildOptimisticConversation(content, activeChatId));
        sessionRef.current?.commitInput(content);
      }
      setDraft('');
      composerMirrorRef.current = '';
    } catch (error: any) {
      setToast({ visible: true, message: error?.message || 'Failed to send message', type: 'error' });
    }
  };

  const beginEdit = (message: AssistantMessage) => {
    setEditingMessage(message);
    setDraft(message.content);
    composerMirrorRef.current = message.content;
  };

  const handleCopyMessage = async (message: AssistantMessage) => {
    try {
      await copyText(message.content);
      setToast({ visible: true, message: 'Copied', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Copy unavailable on this device.', type: 'error' });
    }
  };

  const handleRetryMessage = async (message: AssistantMessage) => {
    try {
      await retryMessage.mutateAsync(message.id);
    } catch (error: any) {
      setToast({ visible: true, message: error?.message || 'Failed to retry', type: 'error' });
    }
  };

  const handleRegenerateMessage = async (message: AssistantMessage) => {
    try {
      await regenerateMessage.mutateAsync(message.id);
    } catch (error: any) {
      setToast({ visible: true, message: error?.message || 'Failed to regenerate', type: 'error' });
    }
  };

  const handleCancelResponse = async (message: AssistantMessage) => {
    try {
      if (sessionRef.current) {
        sessionRef.current.cancelAssistant(message.id);
      } else {
        await cancelMessage.mutateAsync(message.id);
      }
    } catch (error: any) {
      setToast({ visible: true, message: error?.message || 'Failed to cancel', type: 'error' });
    }
  };

  const handleStopActiveResponse = async () => {
    const activeAssistant = [...displayMessages]
      .reverse()
      .find((message) => message.role === 'assistant' && ['queued', 'generating', 'streaming'].includes(message.status));
    if (!activeAssistant) return;
    await handleCancelResponse(activeAssistant);
  };

  const handleArchive = () => {
    Alert.alert('Archive chat', 'This chat will move out of your recent list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveChat.mutateAsync();
            router.replace('/assistant');
          } catch (error: any) {
            setToast({ visible: true, message: error?.message || 'Failed to archive', type: 'error' });
          }
        },
      },
    ]);
  };

  if (isLoading && activeChatId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const sendDisabled = (!hasGenerating && !draft.trim()) || editMessage.isPending || cancelMessage.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Minimal header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 4 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{ flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' }}
            numberOfLines={1}
          >
            {chat.title}
          </Text>

          {activeChatId ? (
            <TouchableOpacity
              onPress={handleArchive}
              style={{ padding: 4, marginLeft: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {displayMessages.map((message) => (
            <AssistantMessageBubble
              key={message.id}
              colors={colors}
              formatTime={formatTime}
              isBusy={isMessageActionPending}
              message={message}
              onCancel={handleCancelResponse}
              onCopy={handleCopyMessage}
              onEdit={beginEdit}
              onRegenerate={handleRegenerateMessage}
              onRetry={handleRetryMessage}
            />
          ))}
        </ScrollView>

        {/* Input area */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 8 : 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {editingMessage && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
                borderRadius: 10,
                backgroundColor: colors.primaryBackground,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                Editing message
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessage(null);
                  setDraft('');
                  composerMirrorRef.current = '';
                }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
              paddingLeft: 16,
              paddingRight: 6,
              paddingVertical: 6,
              minHeight: 48,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);

                if (editingMessage) {
                  composerMirrorRef.current = value;
                  return;
                }

                const previous = composerMirrorRef.current;
                if (!sessionRef.current) {
                  composerMirrorRef.current = value;
                  return;
                }

                if (!value) {
                  sessionRef.current.cancelInput();
                  composerMirrorRef.current = '';
                  return;
                }

                if (value.startsWith(previous)) {
                  const suffix = value.slice(previous.length);
                  if (suffix) sessionRef.current.appendInput(suffix);
                } else {
                  sessionRef.current.cancelInput();
                  sessionRef.current.appendInput(value);
                }

                composerMirrorRef.current = value;
              }}
              placeholder={editingMessage ? 'Edit your message...' : 'Message SEFA...'}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={{
                flex: 1,
                maxHeight: 120,
                color: colors.text,
                fontSize: 15,
                lineHeight: 22,
                paddingTop: 4,
                paddingBottom: 4,
                textAlignVertical: 'center',
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={sendDisabled}
              onPress={hasGenerating ? handleStopActiveResponse : handleSubmit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 6,
                backgroundColor: hasGenerating
                  ? colors.error
                  : draft.trim()
                    ? colors.primary
                    : colors.border,
                opacity: sendDisabled && !hasGenerating ? 0.4 : 1,
              }}
            >
              <Ionicons
                name={hasGenerating ? 'stop' : editingMessage ? 'checkmark' : 'arrow-up'}
                size={17}
                color={hasGenerating || draft.trim() ? colors.textInverse : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
