import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInsightsDashboard, getInsightsSummary, streamInsightsSummary } from './dashboard.service';
import type { AiSummary } from './dashboard.types';

export const INSIGHTS_DASHBOARD_QUERY_KEY = ['insights-dashboard'];

/** Load the cached financial intelligence dashboard. */
export const useInsightsDashboard = (params: { period?: string } = {}) => {
  return useQuery({
    queryKey: [...INSIGHTS_DASHBOARD_QUERY_KEY, params],
    queryFn: () => getInsightsDashboard(params),
    staleTime: 2 * 60 * 1000,
  });
};

interface SummaryStreamState {
  text: string;
  summary: AiSummary | null;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Stream the grounded AI summary (Layer 4). Call `start()` once the dashboard
 * data is ready. Automatically aborts on unmount.
 */
export const useInsightsSummaryStream = (params: { period?: string } = {}) => {
  const [state, setState] = useState<SummaryStreamState>({
    text: '',
    summary: null,
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  // Buffered fallback: fetch the whole summary at once via plain JSON. Used when
  // the runtime can't stream (Expo/Hermes) or the stream errors, so "SEFA
  // explains" always shows real content.
  const loadBuffered = useCallback(async () => {
    try {
      const summary = await getInsightsSummary(params);
      setState({
        summary,
        text: summary?.detailedExplanation || '',
        isStreaming: false,
        error: summary ? null : 'No summary available.',
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Failed to load summary.',
      }));
    }
  }, [params.period]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setState((prev) => ({ ...prev, isStreaming: true, error: null }));

    abortRef.current = await streamInsightsSummary(
      {
        onDelta: (fullText) => setState((prev) => ({ ...prev, text: fullText })),
        onDone: (summary) =>
          setState((prev) => ({
            ...prev,
            summary,
            text: summary?.detailedExplanation || prev.text,
            isStreaming: false,
          })),
        // Streaming not supported on this runtime — load the buffered summary.
        onUnsupported: () => {
          loadBuffered();
        },
        // On any stream error, fall back to buffered rather than showing an error.
        onError: () => {
          loadBuffered();
        },
      },
      params
    );
  }, [params.period, loadBuffered]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
    startedRef.current = false;
    setState({ text: '', summary: null, isStreaming: false, error: null });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  return { ...state, start, reset };
};
