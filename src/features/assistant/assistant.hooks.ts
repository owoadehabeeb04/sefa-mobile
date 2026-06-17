import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveAssistantChat,
  cancelAssistantAction,
  cancelAssistantMessageRequest,
  confirmAssistantAction,
  createAssistantChat,
  editAssistantAction,
  editAssistantMessage,
  getAssistantChat,
  listAssistantChats,
  regenerateAssistantMessage,
  retryAssistantMessage,
  searchAssistantChats,
  sendAssistantMessage,
  subscribeToAssistantChat,
  updateAssistantChat,
} from './assistant.service';
import type { AssistantChatDetail, AssistantChatEvent } from './assistant.types';

export const assistantChatsQueryKey = ['assistant-chats'];
export const assistantChatQueryKey = (chatId: string) => ['assistant-chat', chatId];
export const assistantSearchQueryKey = (query: string) => ['assistant-chats-search', query];

export const useAssistantChats = (params?: { status?: string; includeArchived?: boolean }) => {
  return useQuery({
    queryKey: [...assistantChatsQueryKey, params || {}],
    queryFn: () => listAssistantChats(params),
    staleTime: 30 * 1000,
  });
};

export const useAssistantChat = (chatId?: string) => {
  return useQuery({
    queryKey: assistantChatQueryKey(chatId || ''),
    queryFn: () => getAssistantChat(chatId || ''),
    enabled: Boolean(chatId),
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as AssistantChatDetail | undefined;
      const hasActiveGeneration = Boolean(
        data?.messages?.some((message) => ['queued', 'generating', 'streaming'].includes(message.status)),
      );
      return hasActiveGeneration ? 4000 : false;
    },
  });
};

export const useAssistantChatSearch = (query: string) => {
  return useQuery({
    queryKey: assistantSearchQueryKey(query),
    queryFn: () => searchAssistantChats(query),
    enabled: query.trim().length > 1,
    staleTime: 15 * 1000,
  });
};

const upsertMessage = (messages: AssistantChatDetail['messages'], nextMessage: AssistantChatDetail['messages'][number]) => {
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
  updated[index] = {
    ...updated[index],
    ...nextMessage,
  };
  return updated;
};

export const useAssistantChatStream = (chatId?: string, enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId || !enabled) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    subscribeToAssistantChat(chatId, {
      onEvent: (event: AssistantChatEvent) => {
        if (cancelled) return;

        if (event.chat) {
          queryClient.setQueryData(assistantChatQueryKey(chatId), (previous: AssistantChatDetail | undefined) => {
            if (!previous) return previous;
            return {
              ...previous,
              chat: {
                ...previous.chat,
                ...event.chat,
              },
            };
          });
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
        }

        if (event.message) {
          queryClient.setQueryData(assistantChatQueryKey(chatId), (previous: AssistantChatDetail | undefined) => {
            if (!previous) return previous;
            return {
              ...previous,
              chat: previous.chat,
              messages: upsertMessage(previous.messages, event.message!),
            };
          });
          queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
        }
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      },
    }).then((cleanup) => {
      if (cancelled) {
        cleanup();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [chatId, enabled, queryClient]);
};

export const useCreateAssistantChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createAssistantChat(content),
    onSuccess: (result) => {
      queryClient.setQueryData(assistantChatQueryKey(result.chat.id), result);
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useSendAssistantMessage = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendAssistantMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useEditAssistantMessage = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editAssistantMessage(chatId, messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useRegenerateAssistantMessage = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => regenerateAssistantMessage(chatId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useRetryAssistantMessage = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => retryAssistantMessage(chatId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useCancelAssistantMessage = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => cancelAssistantMessageRequest(chatId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useUpdateAssistantChat = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title?: string; archived?: boolean }) => updateAssistantChat(chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useArchiveAssistantChat = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => archiveAssistantChat(chatId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useConfirmAssistantAction = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => confirmAssistantAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useCancelAssistantAction = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => cancelAssistantAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};

export const useEditAssistantAction = (chatId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, payload }: { actionId: string; payload: Record<string, any> }) =>
      editAssistantAction(actionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantChatQueryKey(chatId) });
      queryClient.invalidateQueries({ queryKey: assistantChatsQueryKey });
    },
  });
};
