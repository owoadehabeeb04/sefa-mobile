import EventSource from 'react-native-sse';

import api, { getStoredToken } from '@/services/api';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

import type {
  AssistantChatDetail,
  AssistantChatEvent,
  AssistantChatMutationResponse,
  AssistantChatResponse,
  AssistantChatSummary,
  AssistantChatsResponse,
  AssistantCreateChatResponse,
  AssistantAction,
  AssistantMessage,
  AssistantMutationMessageResponse,
  AssistantSearchResponse,
} from './assistant.types';

const mapChat = (raw: any): AssistantChatSummary => ({
  id: raw._id || raw.id,
  title: raw.title,
  titleSource: raw.titleSource || 'auto',
  status: raw.status,
  lastMessage: raw.lastMessage || '',
  lastMessageAt: raw.lastMessageAt || raw.updatedAt,
  matchingMessageSnippet: raw.matchingMessageSnippet ?? null,
  archivedAt: raw.archivedAt ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const mapMessage = (raw: any): AssistantMessage => ({
  id: raw._id || raw.id,
  chatId: raw.chatId,
  role: raw.role,
  content: raw.content || '',
  status: raw.status,
  isEdited: Boolean(raw.isEdited),
  editedAt: raw.editedAt ?? null,
  version: Number(raw.version ?? 1),
  parentMessageId: raw.parentMessageId ?? null,
  supersededByMessageId: raw.supersededByMessageId ?? null,
  supersedesMessageId: raw.supersedesMessageId ?? null,
  generatedFromMessageId: raw.generatedFromMessageId ?? null,
  errorMessage: raw.errorMessage ?? null,
  sources: Array.isArray(raw.sources) ? raw.sources.map((source: any) => ({
    title: source.title,
    url: source.url,
    sourceName: source.sourceName,
    priceText: source.priceText ?? null,
    numericPrice: typeof source.numericPrice === 'number' ? source.numericPrice : null,
    currency: source.currency ?? null,
    snippet: source.snippet ?? null,
  })) : [],
  retrieval: raw.retrieval ? {
    mode: raw.retrieval.mode ?? 'none',
    market: raw.retrieval.market ?? 'NG',
    query: raw.retrieval.query ?? '',
    status: raw.retrieval.status ?? 'not_needed',
    providers: Array.isArray(raw.retrieval.providers) ? raw.retrieval.providers : [],
    sourceCount: Number(raw.retrieval.sourceCount ?? 0),
    priceRangeSummary: raw.retrieval.priceRangeSummary ? {
      low: typeof raw.retrieval.priceRangeSummary.low === 'number' ? raw.retrieval.priceRangeSummary.low : null,
      high: typeof raw.retrieval.priceRangeSummary.high === 'number' ? raw.retrieval.priceRangeSummary.high : null,
      median: typeof raw.retrieval.priceRangeSummary.median === 'number' ? raw.retrieval.priceRangeSummary.median : null,
      currency: raw.retrieval.priceRangeSummary.currency ?? null,
      sourceCount: typeof raw.retrieval.priceRangeSummary.sourceCount === 'number'
        ? raw.retrieval.priceRangeSummary.sourceCount
        : null,
    } : null,
    reason: raw.retrieval.reason ?? null,
  } : null,
  actions: Array.isArray(raw.actions) ? raw.actions.map((action: any): AssistantAction => ({
    actionId: action.actionId || action.id,
    id: action.id || action.actionId,
    actionType: action.actionType,
    status: action.status,
    confirmationMessage: action.confirmationMessage || '',
    payload: action.payload || {},
    missingFields: Array.isArray(action.missingFields) ? action.missingFields : [],
  })).filter((action: AssistantAction) => Boolean(action.actionId)) : [],
  completedAt: raw.completedAt ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const createAssistantChat = async (content: string): Promise<AssistantChatDetail> => {
  const response = await api.post<AssistantCreateChatResponse>(API_ENDPOINTS.ASSISTANT.CHATS, { content });
  if (!response.data?.success || !response.data?.data?.chat) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to create assistant chat');
  }

  return {
    chat: mapChat(response.data.data.chat),
    messages: (response.data.data.messages || []).map(mapMessage),
  };
};

export const listAssistantChats = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  includeArchived?: boolean;
}): Promise<{ chats: AssistantChatSummary[]; pagination: AssistantChatsResponse['data']['pagination'] }> => {
  const response = await api.get<AssistantChatsResponse>(API_ENDPOINTS.ASSISTANT.CHATS, { params });
  return {
    chats: (response.data?.data?.chats || []).map(mapChat),
    pagination: response.data?.data?.pagination,
  };
};

export const searchAssistantChats = async (
  query: string,
  signal?: AbortSignal,
): Promise<AssistantChatSummary[]> => {
  const response = await api.get<AssistantSearchResponse>(API_ENDPOINTS.ASSISTANT.SEARCH, {
    params: { q: query },
    signal,
  });

  return (response.data?.data?.chats || []).map(mapChat);
};

export const getAssistantChat = async (chatId: string): Promise<AssistantChatDetail> => {
  const response = await api.get<AssistantChatResponse>(`${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}`);
  if (!response.data?.success || !response.data?.data?.chat) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to load assistant chat');
  }

  return {
    chat: mapChat(response.data.data.chat),
    messages: (response.data.data.messages || []).map(mapMessage),
  };
};

export const sendAssistantMessage = async (chatId: string, content: string) => {
  const response = await api.post<AssistantMutationMessageResponse>(`${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/messages`, {
    content,
  });

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to send assistant message');
  }

  return {
    userMessage: response.data.data.userMessage ? mapMessage(response.data.data.userMessage) : null,
    assistantMessage: response.data.data.assistantMessage ? mapMessage(response.data.data.assistantMessage) : null,
  };
};

const buildAssistantWebSocketUrl = async (chatId?: string | null): Promise<string> => {
  const token = await getStoredToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const baseUrl = API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, '');
  const wsBase = baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  const url = new URL(`${wsBase}/api/v1/assistant/ws`);
  url.searchParams.set('token', token);
  if (chatId) {
    url.searchParams.set('chatId', chatId);
  }
  return url.toString();
};

export type AssistantSocketHandlers = {
  onEvent: (event: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
};

export type AssistantSocketSession = {
  appendInput: (chunk: string) => void;
  commitInput: (content?: string) => void;
  cancelInput: () => void;
  cancelAssistant: (messageId?: string) => void;
  startSession: (payload?: { chatId?: string | null }) => void;
  close: () => void;
};

export const openAssistantSocketSession = async (
  chatId: string | null,
  handlers: AssistantSocketHandlers,
): Promise<AssistantSocketSession> => {
  const url = await buildAssistantWebSocketUrl(chatId);
  const socket = new WebSocket(url);

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(String(event.data || '{}'));
      handlers.onEvent(parsed);
    } catch {
      handlers.onError?.(new Error('Invalid assistant websocket payload'));
    }
  };

  socket.onerror = () => {
    handlers.onError?.(new Error('Assistant live connection failed'));
  };

  socket.onclose = () => {
    handlers.onClose?.();
  };

  const send = (payload: Record<string, any>) => {
    const raw = JSON.stringify(payload);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(raw);
      return;
    }

    const onOpen = () => {
      socket.removeEventListener?.('open', onOpen as any);
      socket.send(raw);
    };
    socket.addEventListener?.('open', onOpen as any);
  };

  return {
    appendInput: (chunk) => send({ type: 'input.append', chunk }),
    commitInput: (content) => send({ type: 'input.commit', ...(typeof content === 'string' ? { content } : {}) }),
    cancelInput: () => send({ type: 'input.cancel' }),
    cancelAssistant: (messageId) => send({ type: 'assistant.cancel', ...(messageId ? { messageId } : {}) }),
    startSession: (payload) => send({ type: 'session.start', ...(payload?.chatId ? { chatId: payload.chatId } : {}) }),
    close: () => socket.close(),
  };
};

export const editAssistantMessage = async (chatId: string, messageId: string, content: string) => {
  const response = await api.patch<AssistantMutationMessageResponse>(
    `${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/messages/${messageId}`,
    { content },
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to edit assistant message');
  }

  return {
    message: response.data.data.message ? mapMessage(response.data.data.message) : null,
    assistantMessage: response.data.data.assistantMessage ? mapMessage(response.data.data.assistantMessage) : null,
  };
};

export const regenerateAssistantMessage = async (chatId: string, messageId: string) => {
  const response = await api.post<AssistantMutationMessageResponse>(
    `${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/messages/${messageId}/regenerate`,
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to regenerate assistant response');
  }

  return response.data.data.assistantMessage ? mapMessage(response.data.data.assistantMessage) : null;
};

export const retryAssistantMessage = async (chatId: string, messageId: string) => {
  const response = await api.post<AssistantMutationMessageResponse>(
    `${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/messages/${messageId}/retry`,
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to retry assistant response');
  }

  return response.data.data.assistantMessage ? mapMessage(response.data.data.assistantMessage) : null;
};

export const cancelAssistantMessageRequest = async (chatId: string, messageId: string) => {
  const response = await api.post<AssistantMutationMessageResponse>(
    `${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/messages/${messageId}/cancel`,
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to cancel assistant response');
  }

  return response.data.data.assistantMessage ? mapMessage(response.data.data.assistantMessage) : null;
};

export const confirmAssistantAction = async (actionId: string) => {
  const response = await api.post(`${API_ENDPOINTS.ASSISTANT.ACTIONS}/${actionId}/confirm`);
  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to confirm assistant action');
  }
  return response.data.data.action;
};

export const cancelAssistantAction = async (actionId: string) => {
  const response = await api.post(`${API_ENDPOINTS.ASSISTANT.ACTIONS}/${actionId}/cancel`);
  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to cancel assistant action');
  }
  return response.data.data.action;
};

export const editAssistantAction = async (actionId: string, payload: Record<string, any>) => {
  const response = await api.post(`${API_ENDPOINTS.ASSISTANT.ACTIONS}/${actionId}/edit`, payload);
  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to edit assistant action');
  }
  return response.data.data.action;
};

export const updateAssistantChat = async (chatId: string, payload: { title?: string; archived?: boolean }) => {
  const response = await api.patch<AssistantChatMutationResponse>(`${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}`, payload);
  if (!response.data?.success || !response.data?.data?.chat) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to update assistant chat');
  }

  return mapChat(response.data.data.chat);
};

export const archiveAssistantChat = async (chatId: string) => {
  await api.delete(`${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}`);
};

type StreamHandlers = {
  onEvent: (event: AssistantChatEvent) => void;
  onError?: (error: Error) => void;
};

// All named SSE events the backend publishes on the assistant chat stream. The
// standard browser EventSource can't send the Authorization header this endpoint
// needs, so we use react-native-sse, which supports custom headers, named events,
// and automatic reconnection.
const ASSISTANT_STREAM_EVENTS = [
  'ready',
  'message.created',
  'message.updated',
  'chat.updated',
  'assistant.activity',
  'assistant.delta',
  'confirmation.required',
  'missing_fields.required',
  'intent.detected',
  'action.completed',
  'action.cancelled',
  'action.updated',
] as const;

export const subscribeToAssistantChat = async (
  chatId: string,
  handlers: StreamHandlers,
): Promise<() => void> => {
  const token = await getStoredToken();

  const es = new EventSource<(typeof ASSISTANT_STREAM_EVENTS)[number]>(
    `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ASSISTANT.CHATS}/${chatId}/stream`,
    {
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // Long-lived stream: don't let the request time out on its own, and let the
      // library reconnect (with this delay) if the connection drops.
      timeout: 0,
      pollingInterval: 5000,
    },
  );

  const forward = (event: { data?: string | null }) => {
    if (!event?.data) return;
    try {
      handlers.onEvent(JSON.parse(event.data) as AssistantChatEvent);
    } catch {
      // Ignore keepalive comments and any malformed frame.
    }
  };

  ASSISTANT_STREAM_EVENTS.forEach((type) => es.addEventListener(type, forward as any));

  es.addEventListener('error', (event: any) => {
    if (event?.type === 'error' || event?.type === 'exception' || event?.type === 'timeout') {
      handlers.onError?.(new Error(event?.message || 'Assistant stream failed'));
    }
  });

  return () => {
    es.removeAllEventListeners();
    es.close();
  };
};
