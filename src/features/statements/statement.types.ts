export type StatementImportStatus =
  | 'uploaded'
  | 'extracting'
  | 'parsed'
  | 'reviewing'
  | 'imported'
  | 'failed'
  | 'cancelled';

export type StatementImportRowStatus =
  | 'ready'
  | 'needs_review'
  | 'duplicate'
  | 'ignored'
  | 'imported'
  | 'failed';

export type StatementClassification = 'income' | 'expense' | 'unknown';
export type StatementDirection = 'debit' | 'credit' | 'unknown';

export interface StatementProgressEntry {
  step: string;
  label: string;
  percent: number;
  at?: string;
}

export interface StatementImportSummary {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  source: string;
  bankName?: string | null;
  statementPeriodStart?: string | null;
  statementPeriodEnd?: string | null;
  currency: string;
  status: StatementImportStatus;
  extractionMethod?: string | null;
  extractionProvider?: string | null;
  extractionModel?: string | null;
  extractionQualityScore: number;
  extractionConfidenceSummary?: {
    averageConfidence: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    unknownConfidenceCount: number;
  } | null;
  totalRows: number;
  readyRows: number;
  needsReviewRows: number;
  duplicateRows: number;
  failedRows: number;
  ignoredRows: number;
  importedRows: number;
  errorMessage?: string | null;
  // Live AI-first progress (drives the story-like processing screen).
  progressStep?: string | null;
  progressPercent?: number;
  progress?: StatementProgressEntry[];
  pageCount?: number;
  processedPageCount?: number;
  isProcessing: boolean;
  canConfirm: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatementImportRow {
  id: string;
  statementImportId: string;
  transactionDate?: string | null;
  transactionTimeProvided?: boolean;
  transactionType?: string | null;
  rawDescription: string;
  description: string;
  counterParty?: string | null;
  transactionId?: string | null;
  debit: number;
  credit: number;
  amount: number;
  balance?: number | null;
  direction: StatementDirection;
  classification: StatementClassification;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
  } | null;
  suggestedCategoryName?: string | null;
  confidence: number;
  status: StatementImportRowStatus;
  duplicateHash?: string | null;
  isDuplicate: boolean;
  validationErrors: string[];
  importedTransactionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatementImportsResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    imports: StatementImportSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore: boolean;
    };
  };
}

export interface StatementImportResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    statementImport: StatementImportSummary;
  };
}

export interface StatementImportRowsResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    rows: StatementImportRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore: boolean;
    };
  };
}

export interface StatementImportConfirmResponse {
  success: boolean;
  message?: string;
  error?: { message?: string };
  data: {
    summary: {
      totalRows: number;
      importedRows: number;
      duplicateRows: number;
      ignoredRows: number;
      failedRows: number;
      needsReviewRows: number;
    };
  };
}

export interface StatementImportRowUpdateInput {
  description?: string;
  transactionDate?: string | null;
  amount?: number;
  classification?: StatementClassification;
  categoryId?: string | null;
  status?: StatementImportRowStatus;
}
