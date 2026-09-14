import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  Wrench,
  Gauge,
  ShieldAlert,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Building,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/client';
import { DashboardStats } from '../types';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [attention, setAttention] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, deptsRes, activityRes, attentionRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/departments'),
        api.get('/dashboard/recent-activity'),
        api.get('/dashboard/attention'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (deptsRes.data.success) setDepartments(deptsRes.data.departments);
      if (activityRes.data.success) setRecentActivities(activityRes.data.activities);
      if (attentionRes.data.success) setAttention(attentionRes.data.attention);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusPieData = stats
    ? [
        { name: 'Operational', value: stats.operational, color: '#10b981' },
        { name: 'Under Maintenance', value: stats.underMaintenance, color: '#3b82f6' },
        { name: 'Under Repair', value: stats.underRepair, color: '#ef4444' },
        { name: 'Needs Calibration', value: stats.needsCalibration, color: '#f59e0b' },
        { name: 'Decommissioned', value: stats.decommissioned, color: '#94a3b8' },
      ].filter(d => d.value > 0)
    : [];

  const departmentChartData = departments.slice(0, 7).map(d => ({
    name: d.department,
    Operational: d.operational,
    Attention: d.attention_needed,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading biomedical telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Hospital Overview</span>
          <h1 className="text-2xl font-black mt-1 tracking-tight">
            EquipSure Biomedical Fleet Center
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span>. Currently overseeing 20 active medical devices with an operational uptime score of{' '}
            <span className="text-teal-400 font-bold underline">{stats?.operationalRate}%</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10">
          <button
            onClick={() => onNavigate('equipment')}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" /> Equipment Inventory
          </button>
          <button
            onClick={() => onNavigate('service-requests')}
            className="bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-600/50 flex items-center gap-1.5 transition"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" /> Report Breakdown
          </button>
        </div>

        {/* Ambient background blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Devices"
          value={stats?.totalEquipment || 0}
          subtitle={`Fleet Value: $${((stats?.totalAssetValue || 0) / 1000).toFixed(0)}k`}
          icon={Cpu}
          variant="blue"
          onClick={() => onNavigate('equipment')}
        />
        <StatCard
          title="Operational"
          value={stats?.operational || 0}
          subtitle={`${stats?.operationalRate}% Fleet Uptime`}
          icon={CheckCircle2}
          variant="emerald"
          badge={`${stats?.operationalRate}%`}
          onClick={() => onNavigate('equipment')}
        />
        <StatCard
          title="Maintenance Due"
          value={stats?.maintenanceDue || 0}
          subtitle="Next 30 days"
          icon={Wrench}
          variant="teal"
          badge={stats && stats.maintenanceDue > 0 ? 'Action Req' : 'Optimal'}
          onClick={() => onNavigate('maintenance')}
        />
        <StatCard
          title="Calibration Due"
          value={stats?.calibrationDue || 0}
          subtitle="Precision checks"
          icon={Gauge}
          variant="amber"
          badge={stats && stats.calibrationDue > 0 ? 'Attention' : 'OK'}
          onClick={() => onNavigate('calibrations')}
        />
        <StatCard
          title="Warranty Expiry"
          value={stats?.warrantyExpiring || 0}
          subtitle="Contracts < 30d"
          icon={ShieldAlert}
          variant="rose"
          badge={stats && stats.warrantyExpiring > 0 ? 'Renew' : 'Valid'}
          onClick={() => onNavigate('warranties')}
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          subtitle="Breakdown repair"
          icon={AlertOctagon}
          variant="purple"
          badge={stats && stats.openTickets > 0 ? 'Open' : 'Clear'}
          onClick={() => onNavigate('service-requests')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Asset Distribution Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                Departmental Asset & Readiness Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Operational readiness across high-acuity hospital units</p>
            </div>
            <button
              onClick={() => onNavigate('equipment')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Operational" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Attention" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Status Donut Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Device Status Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Current operational states of biomedical assets</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Attention & Recent Service Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Attention List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Priority Clinical Attention (Next 14 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Immediate tasks required to prevent device non-compliance</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Open Breakdown Tickets */}
            {attention?.tickets?.length > 0 && attention.tickets.slice(0, 2).map((t: any) => (
              <div
                key={t.id}
                onClick={() => onNavigate('service-requests')}
                className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950 flex items-center gap-2">
                      <span>{t.ticket_number}</span>
                      <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        {t.priority}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{t.equipment_name} — {t.issue_description}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} size="sm" />
              </div>
            ))}

            {/* Overdue / Due Maintenance */}
            {attention?.maintenance?.length > 0 && attention.maintenance.slice(0, 2).map((m: any) => (
              <div
                key={m.id}
                onClick={() => onNavigate('maintenance')}
                className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{m.equipment_name} ({m.equipment_code}) • Due: {m.next_maintenance_date}</p>
                  </div>
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>
            ))}

            {/* Due Calibrations */}
            {attention?.calibrations?.length > 0 && attention.calibrations.slice(0, 2).map((c: any) => (
              <div
                key={c.id}
                onClick={() => onNavigate('calibrations')}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.certificate_number}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{c.equipment_name} • Due: {c.next_due_date}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Service Activities Timeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Live Service Timeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Recent maintenance, repairs, & calibrations</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">{act.equipment_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5 line-clamp-1">{act.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>By: {act.user_name}</span>
                      <span>•</span>
                      <span className="capitalize">{act.activity_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('service-requests')}
            className="mt-4 w-full text-center py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition"
          >
            View Full Service History
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
