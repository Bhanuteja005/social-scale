import React, { useState } from 'react';
import { useCompanies, useOrders } from '../hooks/useApi';
import {  LoadingSpinner } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { SERVICE_TYPE_LABELS, STATUS_COLORS } from '../config/constants';

const Analytics: React.FC = () => {
  const { companies } = useCompanies();
  const { orders, loading } = useOrders();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter orders based on selection
  const filteredOrders = orders.filter((order: any) => {
    const matchesCompany = !selectedCompany || order.companyId === selectedCompany;
    const daysAgo = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), daysAgo);
    const orderDate = new Date(order.createdAt);
    const matchesDate = orderDate >= cutoffDate;
    
    return matchesCompany && matchesDate;
  });

  // Calculate analytics
  const totalOrders = filteredOrders.length;
  const totalSpent = filteredOrders.reduce((sum: number, order: any) => sum + order.cost, 0);
  const totalQuantity = filteredOrders.reduce((sum: number, order: any) => sum + order.quantity, 0);
  const completedOrders = filteredOrders.filter((o: any) => o.status === 'completed').length;
  const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

  // Group by service type
  const serviceTypeStats: Record<string, any> = {};
  filteredOrders.forEach((order: any) => {
    const type = order.serviceType;
    if (!serviceTypeStats[type]) {
      serviceTypeStats[type] = {
        count: 0,
        quantity: 0,
        spent: 0,
      };
    }
    serviceTypeStats[type].count += 1;
    serviceTypeStats[type].quantity += order.quantity;
    serviceTypeStats[type].spent += order.cost;
  });

  const serviceTypeData = Object.entries(serviceTypeStats).map(([type, data]: [string, any]) => ({
    name: SERVICE_TYPE_LABELS[type] || type,
    orders: data.count,
    quantity: data.quantity,
    spent: data.spent,
  }));

  // Group by status
  const statusStats: Record<string, number> = {};
  filteredOrders.forEach((order: any) => {
    statusStats[order.status] = (statusStats[order.status] || 0) + 1;
  });

  const statusData = Object.entries(statusStats).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: STATUS_COLORS[status] || '#888',
  }));

  // Time series data
  const dailyStats: Record<string, any> = {};
  filteredOrders.forEach((order: any) => {
    const date = format(new Date(order.createdAt), 'MMM dd');
    if (!dailyStats[date]) {
      dailyStats[date] = {
        date,
        orders: 0,
        quantity: 0,
        spent: 0,
      };
    }
    dailyStats[date].orders += 1;
    dailyStats[date].quantity += order.quantity;
    dailyStats[date].spent += order.cost;
  });

  const timeSeriesData = Object.values(dailyStats).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Top targets
  const targetStats: Record<string, any> = {};
  filteredOrders.forEach((order: any) => {
    if (!targetStats[order.targetUrl]) {
      targetStats[order.targetUrl] = {
        url: order.targetUrl,
        count: 0,
        quantity: 0,
        spent: 0,
      };
    }
    targetStats[order.targetUrl].count += 1;
    targetStats[order.targetUrl].quantity += order.quantity;
    targetStats[order.targetUrl].spent += order.cost;
  });

  const topTargets = Object.values(targetStats)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 10);

  // Company breakdown
  const companyStats: Record<string, any> = {};
  filteredOrders.forEach((order: any) => {
    const company = companies.find((c: any) => c.companyId === order.companyId);
    const companyName = company?.name || 'Unknown';
    
    if (!companyStats[companyName]) {
      companyStats[companyName] = {
        name: companyName,
        orders: 0,
        spent: 0,
      };
    }
    companyStats[companyName].orders += 1;
    companyStats[companyName].spent += order.cost;
  });

  const companyData = Object.values(companyStats);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="mr-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your social campaigns</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[140px]"
          >
            <option value="">All Companies</option>
            {companies.map((company: any) => (
              <option key={company.companyId} value={company.companyId}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuantity.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{successRate}%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area type="monotone" dataKey="orders" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Over Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Spent']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Service Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar yAxisId="left" dataKey="orders" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="spent" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Company Performance */}
      {!selectedCompany && companyData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="spent" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Targets */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Target URLs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topTargets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                topTargets.map((target: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={target.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 max-w-md truncate block"
                      >
                        {target.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {target.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {target.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${target.spent.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Order Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per order</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Quantity</h3>
          <p className="text-2xl font-bold text-gray-900">
            {totalOrders > 0 ? Math.round(totalQuantity / totalOrders).toLocaleString() : '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per order</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Cost per Unit</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${totalQuantity > 0 ? (totalSpent / totalQuantity).toFixed(4) : '0.0000'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Average cost</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
