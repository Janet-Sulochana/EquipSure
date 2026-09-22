import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  Wrench,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertOctagon,
  User,
  Building,
  Edit,
} from 'lucide-react';
import api from '../api/client';
import { ServiceRequest, Equipment, User as UserType } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ServiceRequestsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [engineers, setEngineers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [submittingResolve, setSubmittingResolve] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Report Breakdown Modal (Available to all staff!)
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportForm, setReportForm] = useState({
    equipment_id: '',
    priority: 'high',
    issue_description: '',
  });

  // Engineer Resolution Modal
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<ServiceRequest | null>(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'in_progress',
    assigned_to: '',
    resolution_details: '',
    spare_parts_used: '',
    repair_cost: '0',
    downtime_hours: '2.0',
  });

  useEffect(() => {
    fetchRequests();
    fetchEquipment();
    fetchEngineers();
  }, [statusFilter, priorityFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/service-requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch service requests:', err);
      showToast('error', 'Error', 'Failed to retrieve breakdown requests.');
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

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'biomedical_engineer' } });
      if (res.data.success) {
        setEngineers(res.data.users);
      }
    } catch (err) {}
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await api.post('/service-requests', reportForm);
      showToast('success', 'Breakdown Dispatched', 'Biomedical engineering staff has been alerted.');
      setReportModalOpen(false);
      setReportForm({ equipment_id: '', priority: 'high', issue_description: '' });
      fetchRequests();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.response?.data?.message || 'Error creating breakdown report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleOpenResolve = (ticket: ServiceRequest) => {
    setActiveTicket(ticket);
    setResolveForm({
      status: ticket.status === 'reported' ? 'in_progress' : ticket.status,
      assigned_to: ticket.assigned_to ? String(ticket.assigned_to) : (user?.id ? String(user.id) : ''),
      resolution_details: ticket.resolution_details || 'Inspected unit, diagnosed sub-assembly failure, replaced component and performed electrical safety check.',
      spare_parts_used: ticket.spare_parts_used || '',
      repair_cost: String(ticket.repair_cost || '0'),
      downtime_hours: String(ticket.downtime_hours || '2.5'),
    });
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setSubmittingResolve(true);
    try {
      await api.put(`/service-requests/${activeTicket.id}`, {
        ...resolveForm,
        repair_cost: parseFloat(resolveForm.repair_cost) || 0,
        downtime_hours: parseFloat(resolveForm.downtime_hours) || 0,
        assigned_to: resolveForm.assigned_to ? parseInt(resolveForm.assigned_to, 10) : null,
      });
      showToast('success', 'Ticket Updated', `Work order ${activeTicket.ticket_number} has been updated.`);
      setResolveModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.message || 'Error updating service request');
    } finally {
      setSubmittingResolve(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Ticket Statuses</option>
            <option value="reported">Reported</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical (Life Support)</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Breakdown reporting button accessible to ALL hospital staff */}
        <button
          onClick={() => setReportModalOpen(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition ml-auto"
        >
          <AlertOctagon className="w-4 h-4" /> Report Equipment Breakdown
        </button>
      </div>

      {/* Service Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Ticket #</th>
                <th className="py-3.5 px-4">Biomedical Device</th>
                <th className="py-3.5 px-4">Department & Room</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Issue Description</th>
                <th className="py-3.5 px-4">Reported By & Date</th>
                <th className="py-3.5 px-4">Assigned Engineer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Downtime / Cost</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Loading repair history...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                    No active breakdown tickets found. All equipment operating normally.
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 group-hover:text-teal-600 transition">
                        {item.ticket_number}
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
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.priority} type="priority" size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-700">
                      <p className="line-clamp-2">{item.issue_description}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      <div className="font-semibold text-slate-900">{item.reporter_name}</div>
                      <div className="text-slate-400">{new Date(item.reported_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.technician_name || (
                        <span className="text-amber-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      <div>{item.downtime_hours} hrs downtime</div>
                      <div className="text-slate-400">${Number(item.repair_cost).toFixed(2)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole(['admin', 'biomedical_engineer']) && (
                        <button
                          onClick={() => handleOpenResolve(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Update / Resolve
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

      {/* Report Breakdown Modal (Hospital Staff Friendly) */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Medical Device Malfunction / Breakdown"
        subtitle="This triggers instant alerts to the on-duty Biomedical Engineering unit."
        maxWidth="lg"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Malfunctioning Equipment *</label>
            <select
              required
              value={reportForm.equipment_id}
              onChange={(e) => setReportForm({ ...reportForm, equipment_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Choose Equipment --</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipment_code} — {eq.name} ({eq.department}, {eq.location_room})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Urgency / Priority *</label>
            <select
              value={reportForm.priority}
              onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="critical">🚨 Critical (Life Support / OR Patient Risk)</option>
              <option value="high">⚠️ High Priority (Department Offline / Severe Impediment)</option>
              <option value="medium">⚡ Medium (Intermittent Glitch / Backup Available)</option>
              <option value="low">ℹ️ Low (Cosmetic / Cable / Non-urgent)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Description & Observed Symptoms *</label>
            <textarea
              rows={4}
              required
              value={reportForm.issue_description}
              onChange={(e) => setReportForm({ ...reportForm, issue_description: e.target.value })}
              placeholder="Describe what occurred, error codes shown on screen, patient impact, and current device location..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReport}
              className="px-5 py-2 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {submittingReport ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4" />
                  <span>Dispatch Service Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update / Resolve Work Order Modal (Biomedical Engineers) */}
      {activeTicket && (
        <Modal
          isOpen={resolveModalOpen}
          onClose={() => setResolveModalOpen(false)}
          title={`Work Order: ${activeTicket.ticket_number}`}
          subtitle={`${activeTicket.equipment_name} (${activeTicket.equipment_code})`}
          maxWidth="xl"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Order Status *</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved (Restores Device to Operational)</option>
                  <option value="closed">Closed / Certified</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Biomedical Engineer</label>
                <select
                  value={resolveForm.assigned_to}
                  onChange={(e) => setResolveForm({ ...resolveForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Unassigned --</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name} ({eng.department})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Downtime Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={resolveForm.downtime_hours}
                  onChange={(e) => setResolveForm({ ...resolveForm, downtime_hours: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Repair & Replacement Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={resolveForm.repair_cost}
                  onChange={(e) => setResolveForm({ ...resolveForm, repair_cost: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Spare Parts Used / Replaced</label>
              <input
                type="text"
                value={resolveForm.spare_parts_used}
                onChange={(e) => setResolveForm({ ...resolveForm, spare_parts_used: e.target.value })}
                placeholder="e.g. Dräger Selectatec O-Ring Kit #M34882"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Engineering Resolution Details</label>
              <textarea
                rows={3}
                required
                value={resolveForm.resolution_details}
                onChange={(e) => setResolveForm({ ...resolveForm, resolution_details: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingResolve}
                className="px-5 py-2 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition disabled:opacity-60 flex items-center gap-1.5"
              >
                {submittingResolve ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ServiceRequestsPage;
