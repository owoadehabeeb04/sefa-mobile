import type { DocumentPickerAsset } from 'expo-document-picker';

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

import type {
  StatementImportConfirmResponse,
  StatementImportResponse,
  StatementImportRow,
  StatementImportRowUpdateInput,
  StatementImportRowsResponse,
  StatementImportSummary,
  StatementImportsResponse,
} from './statement.types';

const mapImport = (raw: any): StatementImportSummary => ({
  id: raw._id || raw.id,
  fileName: raw.fileName,
  fileType: raw.fileType,
  fileSize: raw.fileSize,
  source: raw.source,
  bankName: raw.bankName ?? null,
  statementPeriodStart: raw.statementPeriodStart ?? null,
  statementPeriodEnd: raw.statementPeriodEnd ?? null,
  currency: raw.currency ?? 'NGN',
  status: raw.status,
  extractionMethod: raw.extractionMethod ?? null,
  extractionProvider: raw.extractionProvider ?? null,
  extractionModel: raw.extractionModel ?? null,
  extractionQualityScore: Number(raw.extractionQualityScore ?? 0),
  extractionConfidenceSummary: raw.extractionConfidenceSummary
    ? {
        averageConfidence: Number(raw.extractionConfidenceSummary.averageConfidence ?? 0),
        highConfidenceCount: Number(raw.extractionConfidenceSummary.highConfidenceCount ?? 0),
        mediumConfidenceCount: Number(raw.extractionConfidenceSummary.mediumConfidenceCount ?? 0),
        lowConfidenceCount: Number(raw.extractionConfidenceSummary.lowConfidenceCount ?? 0),
        unknownConfidenceCount: Number(raw.extractionConfidenceSummary.unknownConfidenceCount ?? 0),
      }
    : null,
  totalRows: Number(raw.totalRows ?? 0),
  readyRows: Number(raw.readyRows ?? 0),
  needsReviewRows: Number(raw.needsReviewRows ?? 0),
  duplicateRows: Number(raw.duplicateRows ?? 0),
  failedRows: Number(raw.failedRows ?? 0),
  ignoredRows: Number(raw.ignoredRows ?? 0),
  importedRows: Number(raw.importedRows ?? 0),
  errorMessage: raw.errorMessage ?? null,
  isProcessing: Boolean(raw.isProcessing),
  canConfirm: Boolean(raw.canConfirm),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const mapRow = (raw: any): StatementImportRow => ({
  id: raw._id || raw.id,
  statementImportId: raw.statementImportId,
  transactionDate: raw.transactionDate ?? null,
  transactionTimeProvided: Boolean(raw.transactionTimeProvided),
  transactionType: raw.transactionType ?? null,
  rawDescription: raw.rawDescription ?? '',
  description: raw.description ?? '',
  counterParty: raw.counterParty ?? null,
  transactionId: raw.transactionId ?? null,
  debit: Number(raw.debit ?? 0),
  credit: Number(raw.credit ?? 0),
  amount: Number(raw.amount ?? 0),
  balance: raw.balance === null || raw.balance === undefined ? null : Number(raw.balance),
  direction: raw.direction ?? 'unknown',
  classification: raw.classification ?? 'unknown',
  categoryId: raw.categoryId ?? null,
  category: raw.category
    ? {
        id: raw.category.id || raw.category._id,
        name: raw.category.name,
        icon: raw.category.icon,
        color: raw.category.color,
        type: raw.category.type,
      }
    : null,
  suggestedCategoryName: raw.suggestedCategoryName ?? null,
  confidence: Number(raw.confidence ?? 0),
  status: raw.status,
  duplicateHash: raw.duplicateHash ?? null,
  isDuplicate: Boolean(raw.isDuplicate),
  validationErrors: Array.isArray(raw.validationErrors) ? raw.validationErrors : [],
  importedTransactionId: raw.importedTransactionId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const uploadStatementImport = async (file: DocumentPickerAsset): Promise<StatementImportSummary> => {
  const formData = new FormData();
  const fallbackName = file.name || 'statement-upload';
  formData.append('file', {
    uri: file.uri,
    name: fallbackName,
    type: file.mimeType || 'application/octet-stream',
  } as any);

  const response = await api.post<StatementImportResponse>(
    API_ENDPOINTS.STATEMENT_IMPORTS.UPLOAD,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data?.success || !response.data?.data?.statementImport) {
    throw new Error(response.data?.message || 'We could not upload this statement. Please try again.');
  }

  return mapImport(response.data.data.statementImport);
};

export const getStatementImports = async (): Promise<StatementImportSummary[]> => {
  const response = await api.get<StatementImportsResponse>(API_ENDPOINTS.STATEMENT_IMPORTS.BASE);
  return (response.data?.data?.imports || []).map(mapImport);
};

export const getStatementImport = async (id: string): Promise<StatementImportSummary> => {
  const response = await api.get<StatementImportResponse>(`${API_ENDPOINTS.STATEMENT_IMPORTS.BASE}/${id}`);
  if (!response.data?.success || !response.data?.data?.statementImport) {
    throw new Error(response.data?.message || 'Failed to load statement import');
  }
  return mapImport(response.data.data.statementImport);
};

export const getStatementImportRows = async (
  id: string,
  params?: { status?: string; search?: string }
): Promise<StatementImportRow[]> => {
  const response = await api.get<StatementImportRowsResponse>(
    `${API_ENDPOINTS.STATEMENT_IMPORTS.BASE}/${id}/rows`,
    { params }
  );
  return (response.data?.data?.rows || []).map(mapRow);
};

export const updateStatementImportRow = async (
  statementImportId: string,
  rowId: string,
  payload: StatementImportRowUpdateInput
): Promise<StatementImportRow> => {
  const response = await api.patch(
    `${API_ENDPOINTS.STATEMENT_IMPORTS.BASE}/${statementImportId}/rows/${rowId}`,
    payload
  );

  if (!response.data?.success || !response.data?.data?.row) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to update row');
  }

  return mapRow(response.data.data.row);
};

export const confirmStatementImport = async (statementImportId: string) => {
  const response = await api.post<StatementImportConfirmResponse>(
    `${API_ENDPOINTS.STATEMENT_IMPORTS.BASE}/${statementImportId}/confirm`
  );

  if (!response.data?.success || !response.data?.data?.summary) {
    throw new Error(response.data?.error?.message || response.data?.message || 'Failed to confirm statement import');
  }

  return response.data.data.summary;
};

export const deleteStatementImport = async (statementImportId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.STATEMENT_IMPORTS.BASE}/${statementImportId}`);
};
