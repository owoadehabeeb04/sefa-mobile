/**
 * Import Hooks
 */

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmImportDraft,
  deleteImportDraftRow,
  fetchImportDraft,
  fetchImportJob,
  fetchImportJobs,
  selectImportBank,
  undoImport,
  updateImportDraftRow,
  uploadStatement,
} from './import.service';
import type {
  ImportJob,
  UpdateImportDraftRowPayload,
  UploadStatementPayload,
} from './import.types';

export const IMPORT_JOBS_QUERY_KEY = ['import-jobs'];
export const IMPORT_DRAFT_QUERY_KEY = ['import-draft'];

const isActiveImport = (job?: ImportJob | null) => {
  if (!job) return false;
  return ['queued', 'processing', 'importing'].includes(job.status);
};

export const useImportJobs = (limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: [...IMPORT_JOBS_QUERY_KEY, limit],
    queryFn: ({ pageParam }) => fetchImportJobs(pageParam ?? 1, limit),
    getNextPageParam: (lastPage) => {
      const page = lastPage.pagination?.page ?? 1;
      const pages = lastPage.pagination?.pages ?? 1;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    refetchInterval: (query) => {
      const jobs = query.state.data?.pages.flatMap((page) => page.jobs) ?? [];
      return jobs.some((job) => isActiveImport(job)) ? 3000 : false;
    },
  });
};

export const useImportJob = (jobId: string) => {
  return useQuery({
    queryKey: [...IMPORT_JOBS_QUERY_KEY, jobId],
    queryFn: () => fetchImportJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => (isActiveImport(query.state.data) ? 3000 : false),
  });
};

export const useUploadStatement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadStatementPayload) => uploadStatement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
    },
  });
};

export const useImportDraft = (jobId: string) => {
  return useQuery({
    queryKey: [...IMPORT_DRAFT_QUERY_KEY, jobId],
    queryFn: () => fetchImportDraft(jobId),
    enabled: Boolean(jobId),
  });
};

export const useSelectImportBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, bankSlug }: { jobId: string; bankSlug: string }) =>
      selectImportBank(jobId, bankSlug),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...IMPORT_JOBS_QUERY_KEY, variables.jobId] });
      queryClient.invalidateQueries({ queryKey: [...IMPORT_DRAFT_QUERY_KEY, variables.jobId] });
    },
  });
};

export const useUpdateImportDraftRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rowId,
      payload,
    }: {
      jobId: string;
      rowId: string;
      payload: UpdateImportDraftRowPayload;
    }) => updateImportDraftRow(jobId, rowId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: [...IMPORT_DRAFT_QUERY_KEY, variables.jobId] });
      queryClient.invalidateQueries({ queryKey: [...IMPORT_JOBS_QUERY_KEY, variables.jobId] });
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
    },
  });
};

export const useDeleteImportDraftRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, rowId }: { jobId: string; rowId: string }) =>
      deleteImportDraftRow(jobId, rowId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: [...IMPORT_DRAFT_QUERY_KEY, variables.jobId] });
      queryClient.invalidateQueries({ queryKey: [...IMPORT_JOBS_QUERY_KEY, variables.jobId] });
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
    },
  });
};

export const useConfirmImportDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => confirmImportDraft(jobId),
    onSuccess: (_response, jobId) => {
      queryClient.invalidateQueries({ queryKey: [...IMPORT_JOBS_QUERY_KEY, jobId] });
      queryClient.invalidateQueries({ queryKey: [...IMPORT_DRAFT_QUERY_KEY, jobId] });
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUndoImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => undoImport(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
