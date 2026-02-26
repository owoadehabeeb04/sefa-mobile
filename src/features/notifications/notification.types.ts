// ─── Notification types ────────────────────────────────────────────────────────

export type NotificationType =
  | 'transaction_alert'
  | 'weekly_summary'
  | 'budget_warning'
  | 'spending_insight'
  | 'goal_progress'
  | 'import_complete';

export type NotificationIcon = 'alert' | 'info' | 'success' | 'warning' | 'money' | 'import' | 'goal';

export type NotificationUrgency = 'instant' | 'daily' | 'weekly';

export interface AppNotification {
  id: string;
  _id?: string;
  userId: string;

  // Content
  type: NotificationType;
  title: string;
  message: string;
  icon: NotificationIcon;

  // Related transaction (optional)
  transactionId?: string | null;
  transactionType?: 'expense' | 'income' | null;
  amount?: number;
  category?: string;

  // AI insight
  aiAdvice?: string;
  urgency: NotificationUrgency;
  riskScore?: number;

  // Status
  isRead: boolean;
  readAt?: string | null;
  isSent?: boolean;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';

  // Timestamps
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;

  // Virtual
  timeAgo?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    summary: {
      unreadCount: number;
      total: number;
    };
    pagination: {
      page: number;
      limit: number;
      pages: number;
      hasMore: boolean;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'read' | 'unread';
  type?: NotificationType;
}

// Grouped by date label for display
export interface NotificationGroup {
  label: string; // "Today", "Yesterday", "This Week", "Older"
  data: AppNotification[];
}
