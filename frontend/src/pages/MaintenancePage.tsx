import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { MaintenanceSchedule, Equipment } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const MaintenancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('');

  // Complete maintenance modal state
  const [completeModalOpen, setCompleteModalOpen] = useState<boolean>(false);
  const [activeSchedule, setActiveSchedule] = useState<MaintenanceSchedule | null>(null);
  const [completionChecklist, setCompletionChecklist] = useState<{ task: string; done: boolean }[]>([]);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<string>('');

  // Create maintenance modal state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newSchedule, setNewSchedule] = useState({
    equipment_id: '',
    title: '',
    frequency: 'quarterly',
    next_maintenance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    checklist: [
      { task: 'Visual and mechanical inspection', done: false },
      { task: 'Electrical safety and ground leakage test', done: false },
      { task: 'Operational functional check and self-diagnostics', done: false },
    ],
  });

  useEffect(() => {
    fetchSchedules();
    fetchEquipment();
  }, [statusFilter, timeframeFilter]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (timeframeFilter) params.timeframe = timeframeFilter;

      const res = await api.get('/maintenance', { params });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance schedules:', err);
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

  const handleOpenComplete = (item: MaintenanceSchedule) => {
    setActiveSchedule(item);
    const existingChecklist = Array.isArray(item.checklist) && item.checklist.length > 0
      ? item.checklist
      : [
          { task: 'Clean intake air filters & inspect cables', done: true },
          { task: 'Verify sensor calibration and power supply voltages', done: true },
          { task: 'Perform electrical safety check according to IEC 62353', done: true },
        ];
    setCompletionChecklist(existingChecklist);
    setCompletionNotes(item.notes || 'Preventive maintenance performed per hospital safety SOP. Operational parameters verified.');

    // Precalculate next maintenance date based on frequency
    const nextDate = new Date();
    if (item.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (item.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (item.frequency === 'semi_annual') nextDate.setMonth(nextDate.getMonth() + 6);
    else if (item.frequency === 'annual') nextDate.setFullYear(nextDate.getFullYear() + 1);

    setNextMaintenanceDate(nextDate.toISOString().split('T')[0]);
    setCompleteModalOpen(true);
  };

  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule) return;

    try {
      await api.put(`/maintenance/${activeSchedule.id}/complete`, {
        checklist: completionChecklist,
        notes: completionNotes,
        next_date: nextMaintenanceDate,
      });
      setCompleteModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error completing maintenance');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', newSchedule);
      setCreateModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating maintenance schedule');
    }
  };

  const toggleChecklistItem = (index: number) => {
    setCompletionChecklist(prev =>
      prev.map((item, i) => i === index ? { ...item, done: !item.done } : item)
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Timeframes</option>
            <option value="upcoming_30">Due in Next 30 Days</option>
            <option value="overdue">Overdue Tasks</option>
          </select>
        </div>

        {hasRole(['admin', 'biomedical_engineer']) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition ml-auto"
          >
            <Plus className="w-4 h-4" /> New PPM Schedule
          </button>
        )}
      </div>

      {/* Maintenance Schedules List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">PPM Task & Device</th>
                <th className="py-3.5 px-4">Department & Room</th>
                <th className="py-3.5 px-4">Frequency</th>
                <th className="py-3.5 px-4">Last Done</th>
                <th className="py-3.5 px-4">Next Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Engineer</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading maintenance schedules...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No maintenance schedules found.
                  </td>
                </tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-600 transition">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.equipment_name} <span className="font-mono text-slate-400">({item.equipment_code})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{item.department}</span>
                      <div className="text-[11px] text-slate-400">{item.location_room}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
                        {item.frequency.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {item.last_maintenance_date ? new Date(item.last_maintenance_date).toLocaleDateString() : 'Initial'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {new Date(item.next_maintenance_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.performed_by_name || 'Biomedical Unit'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole(['admin', 'biomedical_engineer']) && item.status !== 'completed' && (
                        <button
                          onClick={() => handleOpenComplete(item)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] transition flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          Log PPM
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Maintenance Modal with Checklist */}
      {activeSchedule && (
        <Modal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          title={`Log Preventive Maintenance: ${activeSchedule.title}`}
          subtitle={`Device: ${activeSchedule.equipment_name} (${activeSchedule.equipment_code})`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitComplete} className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                Preventive Maintenance Task Checklist
              </h4>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {completionChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-white transition"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-xs ${item.done ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Calculated Next Maintenance Due Date *</label>
              <input
                type="date"
                required
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Auto-calculated based on {activeSchedule.frequency} cycle. You can adjust if required.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Engineer Inspection Notes</label>
              <textarea
                rows={3}
                required
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify & Mark Completed
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create New PPM Schedule Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Preventive Maintenance Schedule"
        subtitle="Establish scheduled inspection intervals for clinical equipment."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Biomedical Equipment *</label>
            <select
              required
              value={newSchedule.equipment_id}
              onChange={(e) => setNewSchedule({ ...newSchedule, equipment_id: e.target.value })}
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
            <label className="block font-semibold text-slate-700 mb-1">Maintenance Title / Task *</label>
            <input
              type="text"
              required
              value={newSchedule.title}
              onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
              placeholder="e.g. Quarterly Filter & Electrical Leakage Safety Check"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Frequency *</label>
              <select
                value={newSchedule.frequency}
                onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Scheduled Due Date *</label>
              <input
                type="date"
                required
                value={newSchedule.next_maintenance_date}
                onChange={(e) => setNewSchedule({ ...newSchedule, next_maintenance_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Engineering Instructions</label>
            <textarea
              rows={2}
              value={newSchedule.notes}
              onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
              placeholder="Specific testing procedures, required test kits (Fluke, etc.)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition"
            >
              Schedule Maintenance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
