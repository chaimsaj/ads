export interface User {
  [key: string]: unknown;
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'advertiser';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  totalCampaigns: number;
  totalSpend: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface Campaign {
  [key: string]: unknown;
  id: string;
  name: string;
  userId: string;
  userName: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed' | 'review' | 'rejected' | 'draft';
  adType: 'user' | 'event' | 'brand';
  adFormat: 'banner' | 'interstitial' | 'push';
  boostType: 'standard' | 'premium';
  bannerImage: string | null;
  destinationUrl: string | null;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  revenue: number;
  roi: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface AdminSettings {
  siteName: string;
  supportEmail: string;
  defaultCurrency: string;
  minBudget: number;
  maxBudget: number;
  commissionRate: number;
  autoApprove: boolean;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalRevenue: number;
  pendingApprovals: number;
  userGrowth: number;
  campaignGrowth: number;
  revenueGrowth: number;
}

export interface Activity {
  id: string;
  type: 'served' | 'impressed' | 'clicked' | 'converted';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: Activity[];
}

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}
