import React from 'react';
import { useDashboardStats, useOrders } from '../hooks/useApi';
import { Card, Badge } from '../components/UI';
import {
  Building2,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
  PieChart,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { SERVICE_TYPE_LABELS, STATUS_COLORS } from '../config/constants';

const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { orders, loading: ordersLoading } = useOrders();

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 8);

  // Prepare chart data
  const statusData = Object.entries(stats?.byStatus || {}).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: STATUS_COLORS[status] || '#888',
  }));

  const serviceTypeData = Object.entries(stats?.byServiceType || {}).map(([type, data]: [string, any]) => ({
    name: SERVICE_TYPE_LABELS[type] || type,
    orders: data.count,
    quantity: data.quantity,
    spent: data.spent,
  }));

  // Prepare trend data for the last 7 days
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter(order =>
      format(new Date(order.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'MMM dd'),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + (order.cost || 0), 0),
    };
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'success',
      pending: 'warning',
      in_progress: 'info',
      fail: 'danger',
      canceled: 'danger',
      partial: 'warning',
      awaiting: 'info',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back. Here's an overview of your social media operations.</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCompanies || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ShoppingCart className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.completedOrders || 0}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium text-gray-900">{stats?.inProgressOrders || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalOrders ? ((stats.pendingOrders + (stats.inProgressOrders || 0)) / stats.totalOrders) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Companies</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeCompanies || 0}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Companies</span>
                  <span className="font-medium text-gray-900">{stats?.totalCompanies || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalCompanies ? (stats.activeCompanies / stats.totalCompanies) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(stats?.monthlyRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg per order</span>
                  <span className="font-medium text-gray-900">
                    ₹{stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <Card className="bg-white border border-gray-200 xl:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">7-Day Trend</h3>
                  <p className="text-sm text-gray-500">Order activity</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="text-gray-600" size={20} />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Service Type Chart */}
          <Card className="bg-white border border-gray-200 xl:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Service Types</h3>
                  <p className="text-sm text-gray-500">Order distribution</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="text-gray-600" size={20} />
                </div>
              </div>
              <div className="h-64">
                {serviceTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceTypeData.slice(0, 5)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar
                        dataKey="orders"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Target className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-gray-500 text-sm">No data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Status Distribution */}
          <Card className="bg-white border border-gray-200 xl:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                  <p className="text-sm text-gray-500">Current distribution</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <PieChart className="text-gray-600" size={20} />
                </div>
              </div>
              <div className="h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PieChart className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-gray-500 text-sm">No data available</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {statusData.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <ShoppingCart className="text-gray-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <p className="text-sm text-gray-500">Latest order activity</p>
                </div>
              </div>
              <a
                href="/orders"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <span>View All</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart size={24} className="text-gray-400" />
                </div>
                <h4 className="text-base font-medium text-gray-900 mb-2">No orders yet</h4>
                <p className="text-gray-500 mb-6">Your recent orders will appear here</p>
                <a
                  href="/new-order"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
                >
                  <Zap size={16} />
                  <span>Create Your First Order</span>
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentOrders.map((order: any) => (
                  <div key={order._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {(SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType).charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType}
                            </p>
                            <Badge variant={getStatusBadge(order.status)} className="text-xs">
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {order.targetUrl}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Qty: {order.quantity.toLocaleString()}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">₹{order.cost.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.serviceName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
