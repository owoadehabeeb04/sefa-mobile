/**
 * Import Service
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { ImportHistoryResponse, ImportJob, ImportJobResponse, UploadResponse, UndoImportResponse } from './import.types';

const mapImportJobFromApi = (job: any): ImportJob => ({
  id: job._id ?? job.id,
  source: job.source,
  status: job.status,
  stage: job.stage,
  progress: job.progress,
  totalTransactions: job.totalTransactions,
  importedCount: job.importedCount,
  duplicateCount: job.duplicateCount,
  errorCount: job.errorCount,
  errors: job.errors,
  fileName: job.fileName,
  fileType: job.fileType,
  fileSize: job.fileSize,
  createdAt: job.createdAt,
  completedAt: job.completedAt,
  retentionExpiresAt: job.retentionExpiresAt,
  isUndone: job.isUndone,
  dateRange: job.dateRange,
});

export const uploadStatement = async (
  file: { uri: string; name: string; mimeType?: string },
  metadata?: { bankName?: string; accountNumber?: string }
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as any);

  if (metadata?.bankName) formData.append('bankName', metadata.bankName);
  if (metadata?.accountNumber) formData.append('accountNumber', metadata.accountNumber);

  const response = await api.post<UploadResponse>(API_ENDPOINTS.BANK.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchImportJobs = async (
  page: number,
  limit: number
): Promise<{ jobs: ImportJob[]; pagination: ImportHistoryResponse['pagination'] }> => {
  const response = await api.get<ImportHistoryResponse>(API_ENDPOINTS.BANK.IMPORTS, {
    params: { page, limit },
  });
  const data = response.data;

  return {
    jobs: (data.data || []).map(mapImportJobFromApi),
    pagination: data.pagination,
  };
};

export const fetchImportJob = async (jobId: string): Promise<ImportJob> => {
  const response = await api.get<ImportJobResponse>(`${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}`);
  return mapImportJobFromApi(response.data.data);
};

export const undoImport = async (jobId: string): Promise<UndoImportResponse> => {
  const response = await api.post<UndoImportResponse>(`${API_ENDPOINTS.BANK.UNDO_IMPORT}/${jobId}/undo`);
  return response.data;
};
