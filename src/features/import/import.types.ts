export type ImportSource = 'mono_sync' | 'csv_upload' | 'pdf_upload';
export type ImportStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'undone';
export type BankDetectionConfidence = 'high' | 'medium' | 'low' | 'unknown';
export type ImportStage =
  | 'queued'
  | 'download'
  | 'parse'
  | 'ocr'
  | 'normalize'
  | 'deduplicate'
  | 'categorize'
  | 'save'
  | 'completed'
  | 'failed';

export interface ImportJob {
  id: string;
  source: ImportSource;
  status: ImportStatus;
  stage?: ImportStage;
  progress?: number;
  queueJobId?: string | null;
  totalTransactions?: number;
  sourceRecordCount?: number;
  validRecordCount?: number;
  importedCount?: number;
  duplicateCount?: number;
  errorCount?: number;
  skippedCount?: number;
  errors?: string[];
  errorMessages?: string[];
  warnings?: string[];
  fileName?: string;
  fileType?: string | null;
  fileSize?: number;
  detectedBank?: string;
  detectedBankDisplayName?: string;
  bankDetectionConfidence?: BankDetectionConfidence;
  bankDetectionSource?: string;
  bankHint?: string | null;
  accountNumberHint?: string | null;
  parser?: string | null;
  ocrProvider?: 'azure' | 'google' | null;
  qualityFlags?: string[];
  needsReview?: boolean;
  statementDateRange?: {
    from?: string;
    to?: string;
  };
  createdAt?: string;
  completedAt?: string;
  retentionExpiresAt?: string;
  isUndone?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface UploadStatementPayload {
  file: {
    uri: string;
    name: string;
    mimeType?: string;
  };
  metadata?: {
    bankHint?: string;
    accountNumberHint?: string;
  };
}

export interface ImportHistoryResponse {
  success: boolean;
  data: ImportJob[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ImportJobResponse {
  success: boolean;
  data: ImportJob;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    importJobId: string;
    queueJobId?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    status: ImportStatus;
  };
}

export interface UndoImportResponse {
  success: boolean;
  message?: string;
  data?: {
    deletedExpenses: number;
    deletedIncomes: number;
    totalDeleted: number;
  };
}
