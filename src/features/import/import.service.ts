/**
 * Import Service
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  ImportHistoryResponse,
  ImportJob,
  ImportJobResponse,
  UndoImportResponse,
  UploadResponse,
  UploadStatementPayload,
} from './import.types';

const mapImportJobFromApi = (job: any): ImportJob => ({
  id: job._id ?? job.id,
  source: job.source,
  status: job.status,
  stage: job.stage,
  progress: job.progress,
  queueJobId: job.queueJobId,
  totalTransactions: job.totalTransactions,
  sourceRecordCount: job.sourceRecordCount,
  validRecordCount: job.validRecordCount,
  importedCount: job.importedCount,
  duplicateCount: job.duplicateCount,
  errorCount: job.errorCount,
  skippedCount: job.skippedCount,
  errors: job.errors ?? job.errorMessages,
  errorMessages: job.errorMessages ?? job.errors,
  warnings: job.warnings,
  fileName: job.fileName,
  fileType: job.fileType,
  fileSize: job.fileSize,
  detectedBank: job.detectedBank,
  detectedBankDisplayName: job.detectedBankDisplayName,
  bankDetectionConfidence: job.bankDetectionConfidence,
  bankDetectionSource: job.bankDetectionSource,
  bankHint: job.bankHint,
  accountNumberHint: job.accountNumberHint,
  parser: job.parser,
  ocrProvider: job.ocrProvider,
  qualityFlags: job.qualityFlags,
  needsReview: job.needsReview,
  statementDateRange: job.statementDateRange ?? job.dateRange,
  createdAt: job.createdAt,
  completedAt: job.completedAt,
  retentionExpiresAt: job.retentionExpiresAt,
  isUndone: job.isUndone,
  dateRange: job.statementDateRange ?? job.dateRange,
});

export const uploadStatement = async ({
  file,
  metadata,
}: UploadStatementPayload): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as any);

  if (metadata?.bankHint) formData.append('bankHint', metadata.bankHint);
  if (metadata?.accountNumberHint) {
    formData.append('accountNumberHint', metadata.accountNumberHint);
  }

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
