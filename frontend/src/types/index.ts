export interface User {
  _id: string;
  email: string;
  role: string;
  companyId?: string;
  status: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  _id: string;
  companyId: string;
  name: string;
  notes?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  billingDetails?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    taxId?: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  settings?: {
    timezone?: string;
    currency?: string;
    invoiceMultiplier?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Order {
  _id: string;
  companyId: string;
  providerId: string;
  apiOrderId: string;
  serviceId: number;
  serviceName: string;
  serviceType: 'like' | 'subscribe' | 'comment' | 'like_to_comment' | 'dislike' | 'dislike_to_comment' | 'repost' | 'friend' | 'vote' | 'retweet' | 'follow' | 'favorite';
  targetUrl: string;
  quantity: number;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'awaiting' | 'canceled' | 'fail';
  stats?: {
    before?: {
      count?: number;
      capturedAt?: Date;
    };
    after?: {
      count?: number;
      capturedAt?: Date;
    };
    startCount?: number;
    remains?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  category?: string;
  network?: string;
}

export interface ServiceCategory {
  network: string;
  services: Service[];
  count: number;
}

export interface ServicesResponse {
  categorized: ServiceCategory[];
  byNetwork: { [key: string]: Service[] };
  total: number;
  networks: string[];
  filteredBy: {
    network: string | null;
    minRate: string | null;
    maxRate: string | null;
    minQuantity: string | null;
    maxQuantity: string | null;
  };
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalSpent: number;
  activeOrders: number;
  completedOrders: number;
  totalQuantity: number;
  byServiceType: {
    [key: string]: {
      count: number;
      quantity: number;
      spent: number;
    };
  };
  byStatus: {
    [key: string]: number;
  };
  recentOrders: Order[];
  topTargets: {
    targetUrl: string;
    count: number;
    totalQuantity: number;
  }[];
}

export interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  topServiceType?: string;
}

export interface CreateOrderPayload {
  companyId: string;
  serviceId: number;
  targetUrl: string;
  quantity: number;
}

export interface CreateCompanyPayload {
  name: string;
  notes?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  billingDetails?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    taxId?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
