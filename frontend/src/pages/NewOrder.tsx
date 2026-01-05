import React, { useState } from 'react';
import {  LoadingSpinner } from '../components/UI';
import { useCompanies, useServices } from '../hooks/useApi';
import { ChevronRight, Instagram, Youtube, Facebook, Twitter, Music, Play, MessageCircle } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const networkIcons: Record<string, any> = {
  Instagram: Instagram,
  YouTube: Youtube,
  Facebook: Facebook,
  'X - Twitter': Twitter,
  Spotify: Music,
  TikTok: Play,
  Threads: MessageCircle,
};

const NewOrder: React.FC = () => {
  const { user } = useAuth();
  const { companies } = useCompanies();
  const { services, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyId: user?.companyId || '',
    link: '',
    quantity: '',
    serviceTypeChoice: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Get unique networks from services
  const networks = Array.from(new Set(
    (services?.categorized || []).map((cat: any) => cat.network)
  )).filter(Boolean);

  console.log('Services data:', services);
  console.log('Networks extracted:', networks);

  // Get the selected network object
  const selectedNetworkData = selectedNetwork
    ? (services?.categorized || []).find((cat: any) => cat.network === selectedNetwork)
    : null;

  // Get unique categories for the selected network
  const categories = selectedNetworkData
    ? Array.from(new Set(
        selectedNetworkData.services.map((s: any) => s.category)
      )).filter(Boolean).map((category) => ({
        category,
        services: selectedNetworkData.services.filter((s: any) => s.category === category)
      }))
    : [];

  // Get services for selected category
  const categoryServices = selectedCategory
    ? categories.find((cat: any) => cat.category === selectedCategory)?.services || []
    : [];

  const handleRefetch = async () => {
    try {
      await refetchServices();
      alert('Services refetched');
    } catch (err) {
      console.error(err);
      alert('Failed to refetch services');
    }
  };

  const handleBack = () => {
    if (selectedService) {
      setSelectedService(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else if (selectedNetwork) {
      setSelectedNetwork(null);
    }
  };

  const inferServiceType = (service: any) => {
    const raw = (service?.type || service?.name || '').toString().toLowerCase();
    if (raw.includes('follow')) return 'follow';
    if (raw.includes('fan')) return 'follow';
    if (raw.includes('like')) return 'like';
    if (raw.includes('comment')) return 'comment';
    if (raw.includes('view') || raw.includes('watch')) return 'view';
    if (raw.includes('subscribe') || raw.includes('sub')) return 'subscribe';
    return 'other';
  };

  const getTypeEmoji = (serviceOrType: any) => {
    const type = typeof serviceOrType === 'string' ? serviceOrType : inferServiceType(serviceOrType);
    if (!type) return '⚡';
    if (type.includes('follow')) return '👥';
    if (type.includes('like')) return '❤️';
    if (type.includes('comment')) return '💬';
    if (type.includes('view')) return '▶️';
    if (type.includes('subscribe')) return '🔔';
    return '⚡';
  };

  const getTypeLabel = (serviceOrType: any) => {
    const type = typeof serviceOrType === 'string' ? serviceOrType : inferServiceType(serviceOrType);
    if (!type) return 'Service';
    if (type === 'follow') return 'Followers';
    if (type === 'like') return 'Likes';
    if (type === 'comment') return 'Comments';
    if (type === 'view') return 'Views';
    if (type === 'subscribe') return 'Subscribers';
    return 'Other';
  };

  const handleCreateOrder = async () => {
    if (!formData.companyId || !formData.link || !formData.quantity || !selectedService) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const chosenType = formData.serviceTypeChoice || inferServiceType(selectedService);

      const payload = {
        companyId: formData.companyId,
        service: selectedService.service,
        link: formData.link,
        quantity: parseInt(formData.quantity),
        serviceName: selectedService.name,
        serviceType: chosenType,
        invoiceMultiplier: 8,
      };

      await apiService.createOrder(payload);
      alert('Order created successfully!');
      
      // Reset form
      setFormData({ companyId: '', link: '', quantity: '', serviceTypeChoice: '' });
      setSelectedService(null);
      setSelectedCategory(null);
      setSelectedNetwork(null);
    } catch (error: any) {
      console.error('Order creation error:', error);
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-white mb-4">Failed to Load Services</h1>
        <p className="text-gray-400 mb-6">
          {servicesError}
        </p>
        <button
          onClick={refetchServices}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Back button */}
      {(selectedNetwork || selectedCategory || selectedService) && (
        <button
          onClick={handleBack}
          className="mb-6 px-4 py-2 bg-gray-700 text-purple-400 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      )}

      {/* Network Selection */}
      {!selectedNetwork && (
        <div>
          <h1 className="text-3xl font-bold text-white mb-8">Select network</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {networks.map((network: string) => {
              const Icon = networkIcons[network] || Instagram;
              return (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                    <span className="text-white text-lg font-semibold">{network}</span>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Selection */}
      {selectedNetwork && !selectedCategory && (
        <div>
          <h1 className="text-3xl font-bold text-white mb-8">{selectedNetwork}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category: any) => {
              const Icon = networkIcons[selectedNetwork] || Instagram;
              return (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-lg font-semibold">
                        {category.category}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {category.services.length} service{category.services.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </button>
              );
            })}
          </div>
          {/* Debug / empty state when no categories found */}
          {categories.length === 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 mb-2">No categories found for this network.</p>
              <div className="flex gap-3">
                <button onClick={handleRefetch} className="px-3 py-2 bg-yellow-600 text-white rounded">Refetch services</button>
                <button onClick={() => console.log(services)} className="px-3 py-2 bg-gray-200 text-gray-800 rounded">Log services (console)</button>
              </div>
              <details className="mt-3">
                <summary className="text-xs text-gray-600">Show raw services JSON</summary>
                <pre className="mt-2 max-h-72 overflow-auto text-xs bg-gray-50 p-3 border rounded text-gray-800">{JSON.stringify(services, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Service Selection */}
      {selectedCategory && !selectedService && (
        <div>
          <h1 className="text-3xl font-bold text-white mb-8">
            {selectedNetwork} - {selectedCategory}
          </h1>
          <div className="grid grid-cols-1 gap-3">
            {categoryServices.map((service: any) => (
              <button
                key={service.service}
                onClick={() => {
                  setSelectedService(service);
                  setFormData({ ...formData, serviceTypeChoice: inferServiceType(service) });
                }}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{service.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{getTypeLabel(service)}</span>
                    <span>Min: {service.min}</span>
                    <span>Max: {service.max}</span>
                    <span className="text-green-600">₹{(parseFloat(service.rate) / 1000).toFixed(3)} / unit</span>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Form */}
      {selectedService && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-white mb-6">{selectedService.name}</h1>
            
            <div className="space-y-6">
              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Company *
                </label>
                <div>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Choose a company</option>
                    {companies.map((company: any) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Type (allow override if inference is wrong) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
                <select
                  value={formData.serviceTypeChoice}
                  onChange={(e) => setFormData({ ...formData, serviceTypeChoice: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Auto (inferred)</option>
                  <option value="follow">Followers</option>
                  <option value="like">Likes</option>
                  <option value="comment">Comments</option>
                  <option value="view">Views</option>
                  <option value="subscribe">Subscribers</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">If the service type is incorrect, choose the correct type here.</p>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                        {[100, 500, 1000, 2500, 5000, 10000].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setFormData({ ...formData, quantity: qty.toString() })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.quantity === qty.toString()
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                                <div className="text-xl font-bold">{getTypeEmoji(selectedService)} {qty.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">
                        ₹{((parseFloat(selectedService.rate) / 1000) * qty).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder={`${selectedService.min}`}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-indigo-500"
                  min={selectedService.min}
                  max={selectedService.max}
                />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-600">min {selectedService.min}</span>
                  <span className="text-gray-600">max {parseInt(selectedService.max).toLocaleString()}</span>
                </div>
              </div>

              {/* Link Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="Post Link - Profile must be public"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">Post Link - Profile must be public</p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateOrder}
                disabled={submitting || !formData.companyId || !formData.link || !formData.quantity}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-32">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Service ID</span>
                  <span className="text-gray-900 font-mono">{selectedService.service}</span>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Speed: Fast</span>
                  </div>
                </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="text-sm text-gray-700">Guarantee</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs">✓</span>
                    </div>
                    <span className="text-sm text-gray-700">Cancel button</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-xs">⚡</span>
                    </div>
                    <span className="text-sm text-gray-700">Speed 100K per day</span>
                  </div>
                </div>
                {/* Show full service fields returned by the API so user can inspect */}
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-700">
                  <div><strong>Name:</strong> {selectedService.name}</div>
                  <div><strong>Network:</strong> {selectedService.network || selectedNetwork}</div>
                  <div><strong>Category:</strong> {selectedService.category || selectedCategory}</div>
                  <div><strong>Min:</strong> {selectedService.min}</div>
                  <div><strong>Max:</strong> {selectedService.max}</div>
                  <div><strong>Rate:</strong> ₹{(parseFloat(selectedService.rate) / 1000).toFixed(4)} per unit</div>
                  <div><strong>Inferred Type:</strong> {getTypeLabel(inferServiceType(selectedService))}</div>
                </div>

                {formData.quantity && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Total Cost:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{((parseFloat(selectedService.rate) / 1000) * parseInt(formData.quantity || '0')).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Rate: ₹{(parseFloat(selectedService.rate) / 1000).toFixed(4)} per unit
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrder;
