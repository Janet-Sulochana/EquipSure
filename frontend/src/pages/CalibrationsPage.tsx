import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  FileCheck,
  Building,
} from 'lucide-react';
import api from '../api/client';
import { Calibration, Equipment } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const CalibrationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Record Calibration Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    certificate_number: `CAL-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`,
    calibration_date: new Date().toISOString().split('T')[0],
    next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'passed',
    standard_used: 'ISO 13485 / IEC 60601-1 Medical Electrical Safety',
    accuracy_drift: '< 0.5% full-scale deflection',
    calibrated_by: 'Marcus Reynolds, CBET',
    remarks: 'Calibrated with traceable metrology standards. Safety verification passed.',
  });

  useEffect(() => {
    fetchCalibrations();
    fetchEquipment();
  }, [statusFilter]);

  const fetchCalibrations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/calibrations', { params });
      if (res.data.success) {
        setCalibrations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch calibrations:', err);
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

  const handleCreateCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/calibrations', formData);
      setModalOpen(false);
      fetchCalibrations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording calibration');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Calibration Statuses</option>
            <option value="passed">Passed</option>
            <option value="due_soon">Due Soon (&lt; 30 Days)</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed / Quarantined</option>
          </select>
        </div>

        {hasRole(['admin', 'biomedical_engineer']) && (
          <button
            onClick={() => {
              setFormData({
                ...formData,
                certificate_number: `CAL-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`,
              });
              setModalOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition ml-auto"
          >
            <Plus className="w-4 h-4" /> Record Calibration
          </button>
        )}
      </div>

      {/* Calibrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Certificate #</th>
                <th className="py-3.5 px-4">Device & Code</th>
                <th className="py-3.5 px-4">Department & Room</th>
                <th className="py-3.5 px-4">Standard Applied</th>
                <th className="py-3.5 px-4">Measured Drift / Error</th>
                <th className="py-3.5 px-4">Last Tested</th>
                <th className="py-3.5 px-4">Next Due Date</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Certified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading calibration registry...
                  </td>
                </tr>
              ) : calibrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Gauge className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No calibration records found.
                  </td>
                </tr>
              ) : (
                calibrations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 group-hover:text-teal-600 transition flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {item.certificate_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.equipment_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.equipment_code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.department}</div>
                      <div className="text-[11px] text-slate-400">{item.location_room}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.standard_used}>
                      {item.standard_used}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      {item.accuracy_drift || 'Within tolerance'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(item.calibration_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {new Date(item.next_due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.calibrated_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Calibration Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Device Metrology & Calibration"
        subtitle="Ensure standards comply with ISO/IEC biomedical tolerances."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCalibration} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Equipment *</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Certificate Number *</label>
              <input
                type="text"
                required
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Calibration Result *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="passed">Passed (Compliant)</option>
                <option value="failed">Failed (Quarantine Device)</option>
                <option value="due_soon">Due Soon</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Calibration Date *</label>
              <input
                type="date"
                required
                value={formData.calibration_date}
                onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Calibration Due Date *</label>
              <input
                type="date"
                required
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Standard / Protocol Applied *</label>
            <input
              type="text"
              required
              value={formData.standard_used}
              onChange={(e) => setFormData({ ...formData, standard_used: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Measured Accuracy Drift</label>
              <input
                type="text"
                value={formData.accuracy_drift}
                onChange={(e) => setFormData({ ...formData, accuracy_drift: e.target.value })}
                placeholder="e.g. +0.2% drift"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Calibrated By *</label>
              <input
                type="text"
                required
                value={formData.calibrated_by}
                onChange={(e) => setFormData({ ...formData, calibrated_by: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks & Simulator Traceability</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition"
            >
              Save Calibration Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalibrationsPage;
