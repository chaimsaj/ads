// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginResponse {
  user: User;
}

// Email notification preferences
export interface EmailPreferences {
  marketing: boolean;
  campaignUpdates: boolean;
  weeklyReports: boolean;
  paymentAlerts: boolean;
  securityAlerts: boolean;
}
