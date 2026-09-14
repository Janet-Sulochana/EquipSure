import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  Building,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import api from '../api/client';
import { UtilizationLog, Equipment } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const UtilizationPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<UtilizationLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Log usage modal
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false);
  const [logForm, setLogForm] = useState({
    equipment_id: '',
    log_date: new Date().toISOString().split('T')[0],
    operating_hours: '14.0',
    idle_hours: '10.0',
    patients_served: '18',
  });

  useEffect(() => {
    fetchUtilizationData();
    fetchEquipment();
  }, []);

  const fetchUtilizationData = async () => {
    setLoading(true);
    try {
      const [logsRes, analyticsRes] = await Promise.all([
        api.get('/utilization'),
        api.get('/utilization/analytics'),
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error('Failed to fetch utilization:', err);
      showToast('error', 'Error', 'Failed to retrieve utilization data.');
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

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/utilization', {
        ...logForm,
        operating_hours: parseFloat(logForm.operating_hours),
        idle_hours: parseFloat(logForm.idle_hours),
        patients_served: parseInt(logForm.patients_served, 10) || 0,
      });
      showToast('success', 'Duty Logged', 'Equipment daily duty cycle logged successfully.');
      setLogModalOpen(false);
      fetchUtilizationData();
    } catch (err: any) {
      showToast('error', 'Logging Failed', err.response?.data?.message || 'Error logging equipment utilization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Hospital Utilization</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{analytics?.overview?.avg_hospital_utilization || '62.4'}%</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Optimal Range</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across 30 days active duty-cycle</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Operating Hours</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{Math.round(analytics?.overview?.total_operating_hours || 0)} hrs</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Active scan & diagnostic hours</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients Served</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{analytics?.overview?.total_patients_served || 0}</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Direct clinical encounters</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Devices</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">{analytics?.overview?.active_tracked_devices || 15}</div>
            <p className="text-xs text-slate-500 mt-1">Continuous duty recording</p>
          </div>
          {hasRole(['admin', 'biomedical_engineer']) && (
            <button
              onClick={() => setLogModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" /> Log Duty
            </button>
          )}
        </div>
      </div>

      {/* Underutilized vs High-Stress Overused Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Stress / Overused Equipment */}
        <div className="bg-white rounded-2xl p-6 border border-rose-200/80 shadow-sm bg-gradient-to-b from-white to-rose-50/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                High-Stress / Overused Medical Devices (&gt; 80% Load)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Heavy clinical strain; prone to thermal wear & component fatigue</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              {analytics?.overused?.length || 0} Assets
            </span>
          </div>

          <div className="space-y-3">
            {analytics?.overused?.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No devices currently exceeding safe workload limits.</p>
            ) : (
              analytics?.overused?.map((item: any) => (
                <div key={item.id} className="p-3 rounded-xl border border-rose-200 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{item.equipment_code} • {item.department}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">Avg daily duty: <strong>{item.avg_daily_hours} hrs/day</strong></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 font-mono">{item.avg_utilization}%</span>
                    <span className="block text-[10px] font-semibold text-rose-700 uppercase">High Fatigue</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Underutilized Equipment */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-sm bg-gradient-to-b from-white to-amber-50/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Underutilized Medical Devices (&lt; 20% Load)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Idle capital assets; candidates for unit transfer or bed reassignment</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {analytics?.underutilized?.length || 0} Assets
            </span>
          </div>

          <div className="space-y-3">
            {analytics?.underutilized?.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">All biomedical equipment is operating at healthy capacity.</p>
            ) : (
              analytics?.underutilized?.map((item: any) => (
                <div key={item.id} className="p-3 rounded-xl border border-amber-200 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{item.equipment_code} • {item.department}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">Avg idle: <strong>{item.avg_idle_hours} hrs/day</strong></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-600 font-mono">{item.avg_utilization}%</span>
                    <span className="block text-[10px] font-semibold text-amber-700 uppercase">Under-Capacity</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Utilization Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Equipment Utilization Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Operating hours, idle hours, and patient throughput logs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Log Date</th>
                <th className="py-3 px-4">Biomedical Device</th>
                <th className="py-3 px-4">Department & Room</th>
                <th className="py-3 px-4">Operating Hours</th>
                <th className="py-3 px-4">Idle Hours</th>
                <th className="py-3 px-4">Patients Served</th>
                <th className="py-3 px-4">Utilization Rate</th>
                <th className="py-3 px-4">Stress Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading logs...
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{item.log_date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.equipment_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.equipment_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{item.department}</div>
                      <div className="text-[11px] text-slate-400">{item.location_room}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.operating_hours} hrs</td>
                    <td className="py-3 px-4 text-slate-500">{item.idle_hours} hrs</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.patients_served} patients</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{item.utilization_rate}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.stress_level === 'overused' ? 'bg-rose-100 text-rose-800' :
                        item.stress_level === 'underutilized' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.stress_level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Daily Usage Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Biomedical Device Daily Utilization"
        subtitle="Records operating hours and patient encounter volume."
        maxWidth="md"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Equipment *</label>
            <select
              required
              value={logForm.equipment_id}
              onChange={(e) => setLogForm({ ...logForm, equipment_id: e.target.value })}
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Log Date *</label>
            <input
              type="date"
              required
              value={logForm.log_date}
              onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Hours (hrs) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                required
                value={logForm.operating_hours}
                onChange={(e) => {
                  const op = parseFloat(e.target.value) || 0;
                  setLogForm({
                    ...logForm,
                    operating_hours: e.target.value,
                    idle_hours: String(Math.max(0, 24 - op)),
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Idle Hours (hrs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={logForm.idle_hours}
                onChange={(e) => setLogForm({ ...logForm, idle_hours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patients Scanned / Treated</label>
            <input
              type="number"
              min="0"
              value={logForm.patients_served}
              onChange={(e) => setLogForm({ ...logForm, patients_served: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLogModalOpen(false)}
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
                  <span>Recording...</span>
                </>
              ) : (
                'Record Usage Log'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UtilizationPage;
