import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Cpu,
  Calendar,
  DollarSign,
  Building,
  Shield,
  Clock,
  Wrench,
  CheckCircle,
  FileText,
  AlertOctagon,
  Gauge,
} from 'lucide-react';
import api from '../api/client';
import { Equipment, Department } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface EquipmentPageProps {
  onNavigate?: (tab: string) => void;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({ onNavigate }) => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'maintenance' | 'calibrations' | 'service' | 'utilization'>('overview');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    equipment_code: '',
    name: '',
    category: 'Diagnostic Imaging',
    manufacturer: '',
    model: '',
    serial_number: '',
    department: '',
    location_room: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    warranty_expiry: '',
    status: 'operational',
    criticality: 'medium',
    notes: '',
  });

  useEffect(() => {
    fetchEquipment();
    fetchDepartments();
  }, [department, category, status]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (department) params.department = department;
      if (category) params.category = category;
      if (status) params.status = status;

      const res = await api.get('/equipment', { params });
      if (res.data.success) {
        setEquipmentList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipment();
  };

  const handleViewDetails = async (id: number) => {
    try {
      const res = await api.get(`/equipment/${id}`);
      if (res.data.success) {
        setSelectedEquipment(res.data.equipment);
        setActiveDetailTab('overview');
        setDetailModalOpen(true);
      }
    } catch (err) {
      showToast('Failed to load device lifecycle details', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      equipment_code: `EQ-HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Diagnostic Imaging',
      manufacturer: '',
      model: '',
      serial_number: `SN-${Date.now().toString().slice(-6)}`,
      department: departments[0]?.name || 'Diagnostic Radiology & Imaging',
      location_room: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      warranty_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'operational',
      criticality: 'medium',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      equipment_code: item.equipment_code,
      name: item.name,
      category: item.category,
      manufacturer: item.manufacturer,
      model: item.model,
      serial_number: item.serial_number,
      department: item.department,
      location_room: item.location_room,
      purchase_date: item.purchase_date.split('T')[0],
      purchase_cost: String(item.purchase_cost),
      warranty_expiry: item.warranty_expiry.split('T')[0],
      status: item.status,
      criticality: item.criticality,
      notes: item.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/equipment/${editingItem.id}`, formData);
        showToast(`Equipment ${formData.name} updated successfully!`, 'success');
      } else {
        await api.post('/equipment', formData);
        showToast(`Equipment ${formData.name} registered into hospital database!`, 'success');
      }
      setIsFormOpen(false);
      fetchEquipment();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving equipment record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete biomedical asset "${name}"? This action permanently removes all linked telemetry.`)) return;
    try {
      await api.delete(`/equipment/${id}`);
      showToast(`Device "${name}" deleted from hospital database.`, 'info');
      fetchEquipment();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting equipment', 'error');
    }
  };

  const categories = ['Diagnostic Imaging', 'Life Support', 'Patient Monitoring', 'Surgical', 'Therapeutic', 'Laboratory'];
  const statuses = [
    { label: 'Operational', val: 'operational' },
    { label: 'Under Maintenance', val: 'under_maintenance' },
    { label: 'Under Repair', val: 'under_repair' },
    { label: 'Needs Calibration', val: 'needs_calibration' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by equipment name, code, serial number, manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Department Filter (Dynamic from PostgreSQL) */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          {/* Add Equipment Button (Admin/BME) */}
          {hasRole(['admin', 'biomedical_engineer']) && (
            <button
              onClick={handleOpenCreate}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition ml-auto"
            >
              <Plus className="w-4 h-4" /> Add Medical Device
            </button>
          )}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Device / Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Manufacturer & Model</th>
                <th className="py-3.5 px-4">Department & Room</th>
                <th className="py-3.5 px-4">Warranty Expiry</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Criticality</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                    Loading clinical equipment registry...
                  </td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Cpu className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No biomedical equipment found matching your criteria.
                  </td>
                </tr>
              ) : (
                equipmentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 group-hover:text-teal-600 transition">
                          {item.name}
                        </span>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {item.equipment_code} • {item.serial_number}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{item.manufacturer}</div>
                      <div className="text-[11px] text-slate-400">{item.model}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.department}</div>
                      <div className="text-[11px] text-slate-400">{item.location_room}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {new Date(item.warranty_expiry).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.criticality} type="criticality" size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(item.id)}
                          title="View 360° Lifecycle Record"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole(['admin', 'biomedical_engineer']) && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Equipment Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasRole(['admin']) && (
                          <button
                            onClick={() => handleDeleteEquipment(item.id, item.name)}
                            title="Delete Equipment Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Equipment Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? `Edit Equipment: ${editingItem.equipment_code}` : 'Register New Biomedical Equipment'}
        subtitle="Fields correspond to official hospital capital asset documentation."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEquipment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Code *</label>
              <input
                type="text"
                required
                value={formData.equipment_code}
                onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Device Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                placeholder="e.g. 1.5T MRI Scanner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                placeholder="e.g. Siemens Healthineers"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                required
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Room *</label>
              <input
                type="text"
                required
                value={formData.location_room}
                onChange={(e) => setFormData({ ...formData, location_room: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                placeholder="e.g. Room 104, Bay 2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                {statuses.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Maintenance Protocol</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              placeholder="Clinical usage guidelines, biological shielding or cooling parameters..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
            >
              {submitting ? 'Saving to Database...' : editingItem ? 'Update Device Record' : 'Register Device'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 360° Detailed Equipment View Drawer/Modal */}
      {selectedEquipment && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`${selectedEquipment.name}`}
          subtitle={`${selectedEquipment.equipment_code} • ${selectedEquipment.manufacturer} ${selectedEquipment.model}`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Header Badge Strip & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={selectedEquipment.status} />
                <StatusBadge status={selectedEquipment.criticality} type="criticality" />
                <span className="text-xs text-slate-600 font-semibold">Dept: <strong className="text-slate-900">{selectedEquipment.department}</strong></span>
                <span className="text-xs text-slate-600 font-semibold">Location: <strong className="text-slate-900">{selectedEquipment.location_room}</strong></span>
                <span className="text-xs text-slate-600 font-semibold">Serial: <strong className="font-mono text-slate-900">{selectedEquipment.serial_number}</strong></span>
              </div>

              {onNavigate && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      onNavigate('service-requests');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Report Malfunction
                  </button>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      onNavigate('maintenance');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <Wrench className="w-3.5 h-3.5" /> PPM Schedules
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`py-2.5 px-4 border-b-2 transition ${
                  activeDetailTab === 'overview'
                    ? 'border-teal-500 text-teal-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveDetailTab('maintenance')}
                className={`py-2.5 px-4 border-b-2 transition ${
                  activeDetailTab === 'maintenance'
                    ? 'border-teal-500 text-teal-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Preventive Maintenance ({selectedEquipment.maintenance_schedules?.length || 0})
              </button>
              <button
                onClick={() => setActiveDetailTab('calibrations')}
                className={`py-2.5 px-4 border-b-2 transition ${
                  activeDetailTab === 'calibrations'
                    ? 'border-teal-500 text-teal-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Calibrations ({selectedEquipment.calibrations?.length || 0})
              </button>
              <button
                onClick={() => setActiveDetailTab('service')}
                className={`py-2.5 px-4 border-b-2 transition ${
                  activeDetailTab === 'service'
                    ? 'border-teal-500 text-teal-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Service History ({selectedEquipment.service_requests?.length || 0})
              </button>
              <button
                onClick={() => setActiveDetailTab('utilization')}
                className={`py-2.5 px-4 border-b-2 transition ${
                  activeDetailTab === 'utilization'
                    ? 'border-teal-500 text-teal-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Usage Logs ({selectedEquipment.utilization_logs?.length || 0})
              </button>
            </div>

            {/* Tab: Overview */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Purchase Date</span>
                    <span className="font-bold text-slate-900">{new Date(selectedEquipment.purchase_date).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Asset Value</span>
                    <span className="font-bold text-slate-900">${Number(selectedEquipment.purchase_cost).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Warranty Expiry</span>
                    <span className="font-bold text-slate-900">{new Date(selectedEquipment.warranty_expiry).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-1">Clinical Maintenance Protocol</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedEquipment.notes || 'Standard biomedical engineering handling protocol.'}</p>
                </div>
              </div>
            )}

            {/* Tab: Maintenance */}
            {activeDetailTab === 'maintenance' && (
              <div className="space-y-3 text-xs">
                {selectedEquipment.maintenance_schedules?.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No maintenance tasks scheduled for this device.</p>
                ) : (
                  selectedEquipment.maintenance_schedules.map((m: any) => (
                    <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{m.title}</h4>
                        <p className="text-slate-500 mt-0.5">
                          Frequency: <strong className="capitalize">{m.frequency}</strong> • Next Due: <strong>{m.next_maintenance_date}</strong>
                        </p>
                      </div>
                      <StatusBadge status={m.status} size="sm" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Calibrations */}
            {activeDetailTab === 'calibrations' && (
              <div className="space-y-3 text-xs">
                {selectedEquipment.calibrations?.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No calibration records logged.</p>
                ) : (
                  selectedEquipment.calibrations.map((c: any) => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{c.certificate_number} — {c.standard_used}</h4>
                        <p className="text-slate-500 mt-0.5">
                          Calibrated: {c.calibration_date} • Next Due: {c.next_due_date} • By: {c.calibrated_by}
                        </p>
                        {c.accuracy_drift && <span className="text-[11px] text-amber-700">Drift: {c.accuracy_drift}</span>}
                      </div>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Service History */}
            {activeDetailTab === 'service' && (
              <div className="space-y-3 text-xs">
                {selectedEquipment.service_requests?.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No service or breakdown tickets recorded.</p>
                ) : (
                  selectedEquipment.service_requests.map((s: any) => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{s.ticket_number}</span>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                      <p className="text-slate-700">{s.issue_description}</p>
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                        <span>Reported: {new Date(s.reported_at).toLocaleDateString()}</span>
                        <span>Repair Cost: ${Number(s.repair_cost).toFixed(2)}</span>
                        <span>Downtime: {s.downtime_hours} hrs</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Utilization */}
            {activeDetailTab === 'utilization' && (
              <div className="space-y-3 text-xs">
                {selectedEquipment.utilization_logs?.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No utilization logs recorded for this device.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                          <th className="py-2">Date</th>
                          <th className="py-2">Operating Hours</th>
                          <th className="py-2">Idle Hours</th>
                          <th className="py-2">Patients Served</th>
                          <th className="py-2">Utilization</th>
                          <th className="py-2">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedEquipment.utilization_logs.map((u: any) => (
                          <tr key={u.id}>
                            <td className="py-2 font-mono">{u.log_date}</td>
                            <td className="py-2 font-bold">{u.operating_hours} hrs</td>
                            <td className="py-2 text-slate-500">{u.idle_hours} hrs</td>
                            <td className="py-2 font-semibold text-slate-800">{u.patients_served}</td>
                            <td className="py-2 font-bold text-teal-600">{u.utilization_rate}%</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.stress_level === 'overused' ? 'bg-rose-100 text-rose-700' :
                                u.stress_level === 'underutilized' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {u.stress_level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EquipmentPage;
