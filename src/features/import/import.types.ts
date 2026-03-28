export type ImportSource = 'mono_sync' | 'csv_upload' | 'pdf_upload';
export type ImportStatus =
  | 'queued'
  | 'processing'
  | 'needs_bank_selection'
  | 'needs_review'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'undone';
export type BankDetectionConfidence = 'high' | 'medium' | 'low' | 'unknown';
export type ImportStage =
  | 'queued'
  | 'download'
  | 'parse'
  | 'ocr'
  | 'needs_bank_selection'
  | 'needs_review'
  | 'importing'
  | 'normalize'
  | 'deduplicate'
  | 'categorize'
  | 'save'
  | 'completed'
  | 'failed';

export interface ImportBankOption {
  slug: string;
  displayName: string;
}

export interface ImportDraftSummary {
  totalRows: number;
  includedRows: number;
  excludedRows: number;
  debitTotal: number;
  creditTotal: number;
  lowConfidenceRows: number;
  flaggedRows: number;
}

export interface ImportDraftRow {
  id: string;
  originalRowIndex: number;
  rowIndex?: number;
  date: string;
  description: string;
  amount: number;
  direction: 'debit' | 'credit';
  balance?: number | null;
  reference?: string | null;
  suggestedCategoryId?: string | null;
  suggestedCategoryName?: string | null;
  suggestedCategoryIcon?: string | null;
  suggestedCategoryColor?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  confidence: 'high' | 'medium' | 'low';
  issueFlags: string[];
  excluded: boolean;
  sourceText?: string | null;
}

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
  documentIdentityReasons?: string[];
  qualityFlags?: string[];
  needsReview?: boolean;
  availableBanks?: ImportBankOption[];
  bankSelection?: {
    required: boolean;
    reason?: string | null;
    requestedAt?: string | null;
    selectedBankSlug?: string | null;
    selectedBankDisplayName?: string | null;
    selectedAt?: string | null;
  };
  draftSummary?: ImportDraftSummary;
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
    reviewRequired?: boolean;
  };
}

export interface ImportDraftResponse {
  success: boolean;
  data: {
    importJobId: string;
    status: ImportStatus;
    summary: ImportDraftSummary;
    rows: ImportDraftRow[];
  };
}

export interface UpdateImportDraftRowPayload {
  date?: string;
  description?: string;
  amount?: number;
  direction?: 'debit' | 'credit';
  reference?: string | null;
  balance?: number | null;
  categoryId?: string | null;
  excluded?: boolean;
}

export interface UpdateImportDraftRowResponse {
  success: boolean;
  message?: string;
  data?: {
    row: ImportDraftRow;
    summary: ImportDraftSummary;
  };
}

export interface DeleteImportDraftRowResponse {
  success: boolean;
  message?: string;
  data?: {
    summary: ImportDraftSummary;
  };
}

export interface SelectImportBankResponse {
  success: boolean;
  message?: string;
  data?: ImportJob & {
    queueJobId?: string;
  };
}

export interface ConfirmImportDraftResponse {
  success: boolean;
  message?: string;
  data?: ImportJob & {
    queueJobId?: string;
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
