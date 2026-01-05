import React, { useState } from 'react';
import { useCompanies, useServices, useOrders } from '../hooks/useApi';
import { Card, Button, Input, Modal, LoadingSpinner } from '../components/UI';
import { ShoppingCart, Plus, Search, RefreshCw, DollarSign, X } from 'lucide-react';
import apiService from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { SERVICE_TYPE_LABELS } from '../config/constants';

const Orders: React.FC = () => {
  const { companies } = useCompanies();
  const { services, loading: servicesLoading, error: servicesError } = useServices();
  const { orders, loading: ordersLoading, refetch } = useOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    companyId: '',
    serviceId: '',
    targetUrl: '',
    quantity: '',
  });

  const handleOpenModal = () => {
    if (servicesLoading || servicesError || !services) {
      alert('Please wait for services to load before creating an order.');
      return;
    }
    setFormData({
      companyId: '',
      serviceId: '',
      targetUrl: '',
      quantity: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Basic form validation
      if (!formData.companyId) {
        alert('Please select a company.');
        setSubmitting(false);
        return;
      }

      if (!formData.serviceId) {
        alert('Please select a service.');
        setSubmitting(false);
        return;
      }

      if (!formData.targetUrl) {
        alert('Please enter a target URL.');
        setSubmitting(false);
        return;
      }

      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        alert('Please enter a valid quantity.');
        setSubmitting(false);
        return;
      }

      // Validate quantity against service limits
      const allServices = (services?.categorized || []).flatMap((cat: any) => cat.services || []);
      const selectedService = allServices.find(
        (s: any) => s.service.toString() === formData.serviceId
      );

      if (!selectedService) {
        alert('Selected service not found. Please select a valid service.');
        setSubmitting(false);
        return;
      }

      const quantity = parseInt(formData.quantity);
      const minQty = parseInt(selectedService.min);
      const maxQty = parseInt(selectedService.max);

      if (isNaN(quantity) || quantity < minQty || quantity > maxQty) {
        alert(`Quantity must be between ${minQty} and ${maxQty} for this service.`);
        setSubmitting(false);
        return;
      }

      // Validate URL format
      try {
        new URL(formData.targetUrl);
      } catch {
        alert('Please enter a valid URL.');
        setSubmitting(false);
        return;
      }

      const payload = {
        companyId: formData.companyId,
        service: parseInt(formData.serviceId),
        link: formData.targetUrl,
        quantity: quantity,
        serviceName: selectedService.name || 'Instagram Followers',
        serviceType: 'follow',
        invoiceMultiplier: 8,
      };

      console.log('Creating order with payload:', payload);

      await apiService.createOrder(payload);
      await refetch();
      handleCloseModal();
      alert('Order created successfully!');
    } catch (error: any) {
      console.error('Order creation error:', error);
      alert(error.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter services for Instagram followers - more inclusive filtering
  const instagramFollowerServices = (services?.categorized?.find((cat: any) => cat.network === 'Instagram')?.services || []).filter((service: any) => {
    const serviceName = service.name.toLowerCase();
    const serviceType = service.type?.toLowerCase() || '';
    return serviceType.includes('follow') ||
           serviceName.includes('follower') ||
           serviceName.includes('follow') ||
           serviceName.includes('fans') ||
           serviceName.includes('likes'); // Sometimes follower services are categorized under likes
  });

  // If no Instagram category found, try to find follower services from all categories
  const allFollowerServices = (services?.categorized || []).flatMap((cat: any) =>
    (cat.services || []).filter((service: any) => {
      const serviceName = service.name.toLowerCase();
      const serviceType = service.type?.toLowerCase() || '';
      return (cat.network === 'Instagram' || serviceName.includes('instagram')) &&
             (serviceType.includes('follow') ||
              serviceName.includes('follower') ||
              serviceName.includes('follow'));
    })
  );

  const finalInstagramServices = instagramFollowerServices.length > 0 ? instagramFollowerServices : allFollowerServices;

  // Filter orders
  const filteredOrders = orders.filter((order: any) => {
    const matchesCompany = !filterCompany || order.companyId === filterCompany;
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesSearch = !searchQuery || 
      order.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCompany && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-700 bg-green-100',
      pending: 'text-yellow-700 bg-yellow-100',
      in_progress: 'text-blue-700 bg-blue-100',
      fail: 'text-red-700 bg-red-100',
      canceled: 'text-gray-700 bg-gray-100',
      partial: 'text-orange-700 bg-orange-100',
      awaiting: 'text-purple-700 bg-purple-100',
    };
    return colors[status] || 'text-gray-700 bg-gray-100';
  };

  if (servicesError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load services</h3>
          <p className="text-gray-600 mb-4">{servicesError}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (ordersLoading && !orders.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="mr-4">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Create and manage social media orders</p>
        </div>
        <div className="relative">
          <Button onClick={handleOpenModal} disabled={servicesLoading || !!servicesError}>
            <Plus size={16} className="mr-2" />
            Create Instagram Follower Order
          </Button>
          {(servicesLoading || servicesError) && (
            <p className="text-sm text-gray-500 mt-1">
              {servicesLoading ? 'Loading services...' : 'Services unavailable'}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Section */}
          <div className="flex-1 max-w-md mr-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders by service or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-3 mr-4">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="fail">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center">
            <button
              onClick={refetch}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-600 mb-4">Create your first order to get started</p>
                    <Button onClick={handleOpenModal}>
                      <Plus size={20} className="mr-2" />
                      Create Order
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const company = companies.find((c: any) => c.companyId === order.companyId);
                  const progress = order.stats?.startCount && order.quantity
                    ? ((order.quantity - (order.stats.remains || 0)) / order.quantity * 100).toFixed(0)
                    : 0;

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType}
                        </div>
                        <div className="text-sm text-gray-500">{order.serviceName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          <a
                            href={order.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {order.targetUrl}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.quantity.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${order.cost.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create Instagram Follower Order"
      >
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <ShoppingCart size={16} />
            How to create an order:
          </h4>
          <ol className="text-xs text-blue-800 space-y-1.5 ml-6">
            <li>• Select your company from the dropdown</li>
            <li>• Enter your Instagram profile URL</li>
            <li>• Choose a follower service (rates shown per 1000 followers)</li>
            <li>• Enter the number of followers (min/max limits apply)</li>
            <li>• Review the cost and submit</li>
          </ol>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-amber-600 mt-0.5">💡</div>
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">How Pricing Works</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Social media services are priced per 1000 units. The API returns rates like $348.30 for 1000 followers.
                  This equals $0.3483 per follower. Your total cost is calculated as: (rate × quantity) ÷ 1000.
                </p>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">Select a company</option>
              {companies.map((company: any) => (
                <option key={company.companyId} value={company.companyId}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instagram Profile URL <span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              placeholder="https://instagram.com/yourusername"
              required
            />
            <p className="text-xs text-gray-500 mt-1.5">Example: https://instagram.com/username</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Service (Instagram Followers) <span className="text-red-500">*</span>
            </label>
            {servicesLoading ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm text-gray-600">Loading services...</span>
              </div>
            ) : finalInstagramServices.length === 0 ? (
              <div className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                {servicesLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading available services...
                  </div>
                ) : (
                  "⚠️ No Instagram follower services available. Please contact support."
                )}
              </div>
            ) : (
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Select a follower service</option>
                {finalInstagramServices.map((service: any) => (
                  <option key={service.service} value={service.service}>
                    {service.name} - ₹{parseFloat(service.rate).toFixed(2)} per 1000 (₹{(parseFloat(service.rate) / 1000).toFixed(4)} per follower) (Min: {service.min}, Max: {service.max})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Followers <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="10"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1.5">Enter the number of followers (check service limits above)</p>
          </div>

          {formData.serviceId && formData.quantity && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-3 text-base flex items-center gap-2">
                  <DollarSign size={18} />
                  Order Summary
                </p>
                {(() => {
                  // Find the selected service from all available services
                  const allServices = (services?.categorized || []).flatMap((cat: any) => cat.services || []);
                  const selectedService = allServices.find(
                    (s: any) => s.service.toString() === formData.serviceId
                  );
                  if (selectedService) {
                    const quantity = parseInt(formData.quantity);
                    const minQty = parseInt(selectedService.min);
                    const maxQty = parseInt(selectedService.max);
                    const rate = parseFloat(selectedService.rate);
                    const cost = (rate * quantity) / 1000;

                    // Check if quantity is within limits
                    const isValidQuantity = quantity >= minQty && quantity <= maxQty;

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-blue-200">
                          <span className="text-blue-700">Service:</span>
                          <span className="text-blue-900 font-medium text-right max-w-[60%] truncate">{selectedService.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-blue-200">
                          <span className="text-blue-700">Quantity:</span>
                          <span className="text-blue-900 font-medium">{quantity.toLocaleString()} followers</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-blue-200">
                          <span className="text-blue-700">API Rate:</span>
                          <span className="text-blue-900 font-medium">₹{rate.toFixed(2)} <span className="text-xs text-blue-600">(per 1000)</span></span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-blue-200">
                          <span className="text-blue-700">Effective Rate:</span>
                          <span className="text-blue-900 font-medium">₹{(rate / 1000).toFixed(4)} <span className="text-xs text-blue-600">per follower</span></span>
                        </div>
                        <div className="flex justify-between py-2 bg-gradient-to-r from-green-100 to-emerald-100 -mx-4 px-4 rounded-lg mt-3">
                          <div>
                            <span className="text-green-900 font-semibold">Total Cost:</span>
                            <p className="text-xs text-green-700 mt-0.5">(₹{rate.toFixed(2)} × {quantity} ÷ 1000)</p>
                          </div>
                          <span className="text-green-900 font-bold text-xl">₹{cost.toFixed(2)}</span>
                        </div>
                        {!isValidQuantity && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-xs font-medium flex items-center gap-1">
                              ⚠️ Quantity must be between {minQty.toLocaleString()} and {maxQty.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return <p className="text-red-600 text-sm">⚠️ Service not found</p>;
                })()}
              </div>
            </Card>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="px-6">
              {submitting ? 'Creating Order...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;
