export type ImportSource = 'mono_sync' | 'csv_upload' | 'pdf_upload';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'undone';

export interface ImportJob {
  id: string;
  source: ImportSource;
  status: ImportStatus;
  stage?: string;
  progress?: number;
  totalTransactions?: number;
  importedCount?: number;
  duplicateCount?: number;
  errorCount?: number;
  errors?: string[];
  fileName?: string;
  fileType?: string | null;
  fileSize?: number;
  createdAt?: string;
  completedAt?: string;
  retentionExpiresAt?: string;
  isUndone?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
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
    jobId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    status: string;
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
