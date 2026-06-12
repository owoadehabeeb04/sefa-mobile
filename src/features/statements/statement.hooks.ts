import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { INSIGHTS_HUB_QUERY_KEY } from '@/features/insights/insights.hooks';

import {
  confirmStatementImport,
  deleteStatementImport,
  getStatementImport,
  getStatementImportRows,
  getStatementImports,
  updateStatementImportRow,
  uploadStatementImport,
} from './statement.service';

export const STATEMENT_IMPORTS_QUERY_KEY = ['statement-imports'];
export const statementImportQueryKey = (id: string) => ['statement-import', id];
export const statementImportRowsQueryKey = (id: string, status?: string, search?: string) => [
  'statement-import-rows',
  id,
  status || 'all',
  search || '',
];

export const useStatementImports = () =>
  useQuery({
    queryKey: STATEMENT_IMPORTS_QUERY_KEY,
    queryFn: getStatementImports,
    staleTime: 30 * 1000,
  });

export const useStatementImport = (id?: string) =>
  useQuery({
    queryKey: statementImportQueryKey(id || ''),
    queryFn: () => getStatementImport(id || ''),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'uploaded' || status === 'extracting' || status === 'parsed' ? 3000 : false;
    },
  });

export const useStatementImportRows = (id?: string, filters?: { status?: string; search?: string }) =>
  useQuery({
    queryKey: statementImportRowsQueryKey(id || '', filters?.status, filters?.search),
    queryFn: () => getStatementImportRows(id || '', filters),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
  });

export const useUploadStatementImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadStatementImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENT_IMPORTS_QUERY_KEY });
    },
  });
};

export const useUpdateStatementImportRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      statementImportId,
      rowId,
      payload,
    }: {
      statementImportId: string;
      rowId: string;
      payload: Parameters<typeof updateStatementImportRow>[2];
    }) => updateStatementImportRow(statementImportId, rowId, payload),
    onSuccess: (_row, variables) => {
      queryClient.invalidateQueries({ queryKey: statementImportQueryKey(variables.statementImportId) });
      queryClient.invalidateQueries({ queryKey: ['statement-import-rows', variables.statementImportId] });
      queryClient.invalidateQueries({ queryKey: STATEMENT_IMPORTS_QUERY_KEY });
    },
  });
};

export const useConfirmStatementImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statementImportId: string) => confirmStatementImport(statementImportId),
    onSuccess: (_summary, statementImportId) => {
      queryClient.invalidateQueries({ queryKey: STATEMENT_IMPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: statementImportQueryKey(statementImportId) });
      queryClient.invalidateQueries({ queryKey: ['statement-import-rows', statementImportId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: INSIGHTS_HUB_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['insights-health-score'] });
      queryClient.invalidateQueries({ queryKey: ['insights-forecast'] });
    },
  });
};

export const useDeleteStatementImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statementImportId: string) => deleteStatementImport(statementImportId),
    onSuccess: (_result, statementImportId) => {
      queryClient.invalidateQueries({ queryKey: STATEMENT_IMPORTS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: statementImportQueryKey(statementImportId) });
      queryClient.removeQueries({ queryKey: ['statement-import-rows', statementImportId] });
    },
  });
};
