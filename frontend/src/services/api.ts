import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../config/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            // If no refresh token, redirect to login immediately
            if (!refreshToken) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject({ message: 'Session expired. Please log in again.' });
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, role: string, companyId?: string) {
    const data: any = { email, password, role };
    if (companyId) data.companyId = companyId;
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await this.api.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  // Company endpoints
  async getCompanies(params?: any) {
    const response = await this.api.get('/companies', { params });
    return response.data;
  }

  async getCompanyById(companyId: string) {
    const response = await this.api.get(`/companies/${companyId}`);
    return response.data;
  }

  async createCompany(data: any) {
    const response = await this.api.post('/companies', data);
    return response.data;
  }

  async updateCompany(companyId: string, data: any) {
    const response = await this.api.put(`/companies/${companyId}`, data);
    return response.data;
  }

  async deleteCompany(companyId: string) {
    const response = await this.api.delete(`/companies/${companyId}`);
    return response.data;
  }

  // Order endpoints
  async getOrders(params?: any) {
    const response = await this.api.get('/orders', { params });
    return response.data;
  }

  async getOrderById(orderId: string) {
    const response = await this.api.get(`/orders/${orderId}`);
    return response.data;
  }

  async getCompanyOrders(companyId: string, params?: any) {
    const response = await this.api.get(`/orders/company/${companyId}`, { params });
    return response.data;
  }

  async createOrder(data: any) {
    const response = await this.api.post('/api-integrations/orders', data);
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const response = await this.api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }

  async getOrderStats() {
    const response = await this.api.get('/orders/stats');
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(params?: any) {
    const response = await this.api.get('/analytics', { params });
    return response.data;
  }

  async getDashboardStats() {
    const response = await this.api.get('/analytics/dashboard');
    return response.data;
  }

  async getCompanyOrderHistory(companyId: string, params?: any) {
    const response = await this.api.get(`/analytics/company/${companyId}/history`, {
      params,
    });
    return response.data;
  }

  async getOrderDetailsByTarget(targetUrl: string) {
    const response = await this.api.get('/analytics/target/' + encodeURIComponent(targetUrl));
    return response.data;
  }

  // API Integration endpoints
  async getServices() {
    const response = await this.api.get('/api-integrations/services');
    return response.data;
  }

  async createApiOrder(data: any) {
    const response = await this.api.post('/api-integrations/orders', data);
    return response.data;
  }

  async getOrderStatus(orderId: string) {
    const response = await this.api.get(`/api-integrations/orders/${orderId}/status`);
    return response.data;
  }

  async getIntegrationLogs(params?: any) {
    const response = await this.api.get('/api-integrations/logs', { params });
    return response.data;
  }

  async getSubscriptionPlans() {
    const response = await this.api.get('/subscriptions/plans');
    return response.data;
  }

  async getUserCredits() {
    const response = await this.api.get('/subscriptions/credits');
    return response.data;
  }

  async getUserSubscriptions() {
    const response = await this.api.get('/subscriptions');
    return response.data;
  }

  async createSubscription(data: any) {
    const response = await this.api.post('/subscriptions', data);
    return response.data;
  }

  async activateSubscription(data: any) {
    const response = await this.api.post('/subscriptions/activate', data);
    return response.data;
  }
}

export default new ApiService();
