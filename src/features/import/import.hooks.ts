/**
 * Import Hooks
 */

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchImportJob, fetchImportJobs, undoImport, uploadStatement } from './import.service';

export const IMPORT_JOBS_QUERY_KEY = ['import-jobs'];

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
  });
};

export const useImportJob = (jobId: string) => {
  return useQuery({
    queryKey: [...IMPORT_JOBS_QUERY_KEY, jobId],
    queryFn: () => fetchImportJob(jobId),
    enabled: Boolean(jobId),
  });
};

export const useUploadStatement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadStatement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_JOBS_QUERY_KEY });
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
