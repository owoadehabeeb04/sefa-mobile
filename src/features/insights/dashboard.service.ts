import api, { getStoredToken } from '@/services/api';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import type { AiSummary, DashboardApiResponse, DashboardData, SummaryStreamHandlers } from './dashboard.types';

/**
 * Fetch the full financial intelligence dashboard (cached snapshot on the
 * backend). The AI summary may be null here — stream or fetch it separately.
 */
export const getInsightsDashboard = async (
  params: { period?: string; refresh?: boolean } = {}
): Promise<DashboardData> => {
  const response = await api.get<DashboardApiResponse>(API_ENDPOINTS.INSIGHTS.DASHBOARD, {
    params,
  });
  return response.data.data;
};

/** Fetch the grounded AI summary (buffered, non-streaming). */
export const getInsightsSummary = async (params: { period?: string } = {}): Promise<AiSummary | null> => {
  const response = await api.get<{ data: { aiSummary: AiSummary | null } }>(API_ENDPOINTS.INSIGHTS.SUMMARY, {
    params,
  });
  return response.data.data.aiSummary;
};

const parseSseEvent = (block: string): { event: string; data: any } | null => {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
};

/**
 * Stream the grounded AI summary via SSE (Layer 4). Returns an abort function.
 * Reuses the same fetch + ReadableStream approach as the assistant chat stream.
 */
export const streamInsightsSummary = async (
  handlers: SummaryStreamHandlers,
  params: { period?: string } = {}
): Promise<() => void> => {
  const token = await getStoredToken();
  const controller = new AbortController();

  const run = async () => {
    try {
      const query = params.period ? `?period=${encodeURIComponent(params.period)}` : '';
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.INSIGHTS.SUMMARY_STREAM}${query}`,
        {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error('Live summary is unavailable right now.');
      }

      // Some React Native runtimes (Expo/Hermes) do not expose a readable
      // response.body for streaming. Signal the caller to fall back to the
      // buffered summary endpoint instead of surfacing an error to the user.
      if (!response.body || typeof response.body.getReader !== 'function') {
        handlers.onUnsupported?.();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const parsed = parseSseEvent(part);
          if (!parsed) continue;
          if (parsed.event === 'delta' && typeof parsed.data?.fullText === 'string') {
            handlers.onDelta?.(parsed.data.fullText);
          } else if (parsed.event === 'summary') {
            handlers.onDone?.(parsed.data?.aiSummary ?? null);
          } else if (parsed.event === 'error') {
            handlers.onError?.(new Error(parsed.data?.message || 'Summary stream failed'));
          }
        }
      }
    } catch (error: any) {
      if (controller.signal.aborted) return;
      handlers.onError?.(error instanceof Error ? error : new Error('Summary stream failed'));
    }
  };

  run();

  return () => controller.abort();
};
