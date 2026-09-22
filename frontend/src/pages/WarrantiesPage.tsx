import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Building,
  DollarSign,
  Clock,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { Warranty, Equipment } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const WarrantiesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('');

  // Add / Renew Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    provider_name: '',
    contract_type: 'CMC',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    coverage_terms: '24/7 on-site technical support, comprehensive parts and preventive maintenance visits.',
    annual_cost: '5000',
    status: 'active',
  });

  useEffect(() => {
    fetchWarranties();
    fetchEquipment();
  }, [statusFilter, contractTypeFilter]);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (contractTypeFilter) params.contract_type = contractTypeFilter;

      const res = await api.get('/warranties', { params });
      if (res.data.success) {
        setWarranties(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch warranties:', err);
      showToast('error', 'Error', 'Failed to retrieve warranty records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment', { params: { limit: 100 } });
      if (res.data.success) {
        setEquipmentList(res.data.data);
      }
    } catch (err) {}
  };

  const handleCreateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/warranties', formData);
      showToast('success', 'Warranty Saved', 'Warranty contract details have been successfully recorded.');
      setModalOpen(false);
      fetchWarranties();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.response?.data?.message || 'Error saving warranty contract');
    } finally {
      setSubmitting(false);
    }
  };

  const contractTypes = [
    { label: 'Comprehensive Maintenance (CMC)', val: 'CMC' },
    { label: 'Annual Maintenance Contract (AMC)', val: 'AMC' },
    { label: 'OEM Standard Factory Warranty', val: 'OEM_Standard' },
    { label: 'Extended Protection Plan', val: 'Extended' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Warranty Statuses</option>
            <option value="active">Active Contracts</option>
            <option value="expiring_soon">Expiring Soon (&lt; 30 Days)</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={contractTypeFilter}
            onChange={(e) => setContractTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Contract Types</option>
            {contractTypes.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
          </select>
        </div>

        {hasRole(['admin', 'biomedical_engineer']) && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition ml-auto"
          >
            <Plus className="w-4 h-4" /> Add / Renew Warranty
          </button>
        )}
      </div>

      {/* Warranties Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Biomedical Device</th>
                <th className="py-3.5 px-4">Service Provider & Contract</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Expiry Status</th>
                <th className="py-3.5 px-4">Annual Commitment</th>
                <th className="py-3.5 px-4">Vendor Contact</th>
                <th className="py-3.5 px-4">Contract Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading warranty records...
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No warranty contracts found.
                  </td>
                </tr>
              ) : (
                warranties.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-600 transition">
                        {item.equipment_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.equipment_code} • {item.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.provider_name}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {item.contract_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(item.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {new Date(item.end_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.days_remaining !== undefined && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.days_remaining < 0 ? 'bg-rose-100 text-rose-800' :
                          item.days_remaining <= 30 ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {item.days_remaining < 0
                            ? `Expired ${Math.abs(item.days_remaining)}d ago`
                            : `${item.days_remaining} days left`}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${Number(item.annual_cost).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      <div className="font-medium text-slate-800">{item.contact_person || 'Customer Support'}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {item.contact_phone || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Renew Warranty Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register / Renew Warranty & Service Contract"
        subtitle="Manage AMC, CMC, or OEM contracts with critical healthcare SLAs."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateWarranty} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Biomedical Equipment *</label>
            <select
              required
              value={formData.equipment_id}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">-- Choose Equipment --</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipment_code} — {eq.name} ({eq.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Provider / Vendor *</label>
              <input
                type="text"
                required
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="e.g. Siemens Healthineers Customer Care"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contract Type *</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="CMC">Comprehensive Maintenance (CMC)</option>
                <option value="AMC">Annual Maintenance Contract (AMC)</option>
                <option value="OEM_Standard">OEM Factory Warranty</option>
                <option value="Extended">Extended Warranty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Cost ($)</label>
              <input
                type="number"
                value={formData.annual_cost}
                onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Coverage Terms & Hospital SLAs</label>
            <textarea
              rows={2}
              value={formData.coverage_terms}
              onChange={(e) => setFormData({ ...formData, coverage_terms: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Warranty Contract'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarrantiesPage;
