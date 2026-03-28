/**
 * Import Service
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  ConfirmImportDraftResponse,
  DeleteImportDraftRowResponse,
  ImportHistoryResponse,
  ImportJob,
  ImportJobResponse,
  ImportDraftResponse,
  ImportDraftRow,
  SelectImportBankResponse,
  UndoImportResponse,
  UpdateImportDraftRowPayload,
  UpdateImportDraftRowResponse,
  UploadResponse,
  UploadStatementPayload,
} from './import.types';

const mapImportDraftRowFromApi = (row: any): ImportDraftRow => ({
  id: row._id ?? row.id,
  originalRowIndex: row.originalRowIndex ?? row.rowIndex ?? 0,
  rowIndex: row.rowIndex,
  date: row.date,
  description: row.description,
  amount: row.amount,
  direction: row.direction,
  balance: row.balance ?? null,
  reference: row.reference ?? null,
  suggestedCategoryId: row.suggestedCategoryId ?? null,
  suggestedCategoryName: row.suggestedCategoryName ?? null,
  suggestedCategoryIcon: row.suggestedCategoryIcon ?? null,
  suggestedCategoryColor: row.suggestedCategoryColor ?? null,
  categoryId: row.categoryId ?? null,
  categoryName: row.categoryName ?? null,
  categoryIcon: row.categoryIcon ?? null,
  categoryColor: row.categoryColor ?? null,
  confidence: row.confidence ?? 'medium',
  issueFlags: row.issueFlags ?? [],
  excluded: Boolean(row.excluded),
  sourceText: row.sourceText ?? null,
});

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
  documentIdentityReasons: job.documentIdentityReasons ?? [],
  qualityFlags: job.qualityFlags,
  needsReview: job.needsReview,
  availableBanks: job.availableBanks ?? [],
  bankSelection: job.bankSelection ?? undefined,
  draftSummary: job.draftSummary ?? undefined,
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

export const fetchImportDraft = async (jobId: string): Promise<ImportDraftResponse['data']> => {
  const response = await api.get<ImportDraftResponse>(`${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}/draft`);
  const data = response.data.data;

  return {
    importJobId: data.importJobId,
    status: data.status,
    summary: data.summary,
    rows: (data.rows ?? []).map(mapImportDraftRowFromApi),
  };
};

export const selectImportBank = async (
  jobId: string,
  bankSlug: string,
): Promise<SelectImportBankResponse> => {
  const response = await api.post<SelectImportBankResponse>(
    `${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}/select-bank`,
    { bankSlug },
  );

  if (response.data.data) {
    response.data.data = mapImportJobFromApi(response.data.data as any) as any;
  }

  return response.data;
};

export const updateImportDraftRow = async (
  jobId: string,
  rowId: string,
  payload: UpdateImportDraftRowPayload,
): Promise<UpdateImportDraftRowResponse> => {
  const response = await api.patch<UpdateImportDraftRowResponse>(
    `${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}/draft/${rowId}`,
    payload,
  );

  if (response.data.data?.row) {
    response.data.data.row = mapImportDraftRowFromApi(response.data.data.row as any) as any;
  }

  return response.data;
};

export const deleteImportDraftRow = async (
  jobId: string,
  rowId: string,
): Promise<DeleteImportDraftRowResponse> => {
  const response = await api.delete<DeleteImportDraftRowResponse>(
    `${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}/draft/${rowId}`,
  );
  return response.data;
};

export const confirmImportDraft = async (jobId: string): Promise<ConfirmImportDraftResponse> => {
  const response = await api.post<ConfirmImportDraftResponse>(
    `${API_ENDPOINTS.BANK.IMPORT_STATUS}/${jobId}/confirm`,
  );

  if (response.data.data) {
    response.data.data = mapImportJobFromApi(response.data.data as any) as any;
  }

  return response.data;
};

export const undoImport = async (jobId: string): Promise<UndoImportResponse> => {
  const response = await api.post<UndoImportResponse>(`${API_ENDPOINTS.BANK.UNDO_IMPORT}/${jobId}/undo`);
  return response.data;
};
