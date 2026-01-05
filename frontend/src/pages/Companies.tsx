import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '../hooks/useApi';
import {  Button, Input, Modal, LoadingSpinner, Badge } from '../components/UI';
import { Building2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import apiService from '../services/api';
import { formatDistanceToNow } from 'date-fns';


const Companies: React.FC = () => {
  const { companies, loading, refetch } = useCompanies();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'USD',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenModal = (company?: any) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name,
        notes: company.notes || '',
        contactName: company.billingDetails?.contactName || '',
        contactEmail: company.billingDetails?.contactEmail || '',
        contactPhone: company.billingDetails?.contactPhone || '',
        currency: company.settings?.currency || 'USD',
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: '',
        notes: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        currency: 'USD',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        notes: formData.notes,
        billingDetails: {
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
        },
        settings: {
          currency: formData.currency,
        },
      };

      if (selectedCompany) {
        await apiService.updateCompany(selectedCompany.companyId, payload);
      } else {
        await apiService.createCompany(payload);
      }

      await refetch();
      handleCloseModal();
      
      // Redirect to NewOrder page after company creation
      navigate('/new-order');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      await apiService.deleteCompany(companyId);
      await refetch();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete company');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Companies</h1>
          <p className="text-gray-400 mt-1">Manage client companies and their accounts</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2" />
          Add Company
        </Button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.length === 0 ? (
          <div className="col-span-full bg-gray-800 border border-gray-700 rounded-xl text-center py-16">
            <Building2 size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No companies yet</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first company</p>
            <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={20} className="mr-2" />
              Add Company
            </Button>
          </div>
        ) : (
          companies.map((company: any) => (
            <div key={company._id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-indigo-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{company.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{company.companyId.slice(0, 8)}...</p>
                  </div>
                </div>
                <Badge variant={company.status === 'active' ? 'success' : 'default'} className="capitalize">
                  {company.status}
                </Badge>
              </div>

              {company.notes && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{company.notes}</p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                {company.billingDetails?.contactEmail && (
                  <div className="flex items-center text-gray-300">
                    <span className="font-medium mr-2 text-gray-400">Email:</span>
                    <span className="truncate">{company.billingDetails.contactEmail}</span>
                  </div>
                )}
                {company.billingDetails?.contactPhone && (
                  <div className="flex items-center text-gray-300">
                    <span className="font-medium mr-2 text-gray-400">Phone:</span>
                    <span>{company.billingDetails.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-300">
                  <span className="font-medium mr-2 text-gray-400">Created:</span>
                  <span>{formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <a
                  href={`/orders?company=${company.companyId}`}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center transition-colors"
                >
                  <Eye size={16} className="mr-1" />
                  View Orders
                </a>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(company)}
                    className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-700"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(company.companyId)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCompany ? 'Edit Company' : 'Add New Company'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Acme Corp"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about the company..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-medium text-white mb-3">Contact Information</h4>

            <div className="space-y-4">
              <Input
                label="Contact Name"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="John Doe"
              />

              <Input
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="john@example.com"
              />

              <Input
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? 'Saving...' : selectedCompany ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Companies;
