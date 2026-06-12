export type AssistantChatStatus = 'idle' | 'generating' | 'failed' | 'archived';
export type AssistantMessageRole = 'user' | 'assistant';
export type AssistantMessageStatus =
  | 'queued'
  | 'generating'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'superseded';

export interface AssistantMessageSource {
  title: string;
  url: string;
  sourceName: string;
  priceText?: string | null;
  numericPrice?: number | null;
  currency?: string | null;
  snippet?: string | null;
}

export interface AssistantMessageRetrieval {
  mode: 'none' | 'general_web' | 'shopping';
  market: string;
  query: string;
  status: 'not_needed' | 'used' | 'unavailable';
  providers: string[];
  sourceCount: number;
  priceRangeSummary?: {
    low?: number | null;
    high?: number | null;
    median?: number | null;
    currency?: string | null;
    sourceCount?: number | null;
  } | null;
  reason?: string | null;
}

export interface AssistantChatSummary {
  id: string;
  title: string;
  titleSource: 'auto' | 'manual';
  status: AssistantChatStatus;
  lastMessage: string;
  lastMessageAt: string;
  matchingMessageSnippet?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  id: string;
  chatId: string;
  role: AssistantMessageRole;
  content: string;
  status: AssistantMessageStatus;
  isEdited: boolean;
  editedAt?: string | null;
  version: number;
  parentMessageId?: string | null;
  supersededByMessageId?: string | null;
  supersedesMessageId?: string | null;
  generatedFromMessageId?: string | null;
  errorMessage?: string | null;
  sources: AssistantMessageSource[];
  retrieval?: AssistantMessageRetrieval | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantChatDetail {
  chat: AssistantChatSummary;
  messages: AssistantMessage[];
}

export interface AssistantChatsResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    chats: AssistantChatSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore: boolean;
    };
  };
}

export interface AssistantChatResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: AssistantChatDetail;
}

export interface AssistantSearchResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    chats: AssistantChatSummary[];
  };
}

export interface AssistantCreateChatResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    chat: AssistantChatSummary;
    messages: AssistantMessage[];
  };
}

export interface AssistantMutationMessageResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    message?: AssistantMessage | null;
    userMessage?: AssistantMessage | null;
    assistantMessage?: AssistantMessage | null;
  };
}

export interface AssistantChatMutationResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    chat: AssistantChatSummary;
  };
}

export interface AssistantChatEvent {
  type: string;
  chatId: string;
  emittedAt: string;
  chat?: AssistantChatSummary;
  message?: AssistantMessage;
  status?: AssistantChatStatus;
}
