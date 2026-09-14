import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Wrench,
  Gauge,
  ShieldCheck,
  AlertCircle,
  Activity,
  FileBarChart,
  LogOut,
  UserCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, quickDemoLogin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipment', label: 'Equipment Inventory', icon: Cpu },
    { id: 'maintenance', label: 'Preventive Maintenance', icon: Wrench },
    { id: 'calibrations', label: 'Calibrations', icon: Gauge },
    { id: 'warranties', label: 'Warranty Tracking', icon: ShieldCheck },
    { id: 'service-requests', label: 'Service & Repairs', icon: AlertCircle },
    { id: 'utilization', label: 'Utilization Tracking', icon: Activity },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
  ];

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { title: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'biomedical_engineer':
        return { title: 'Biomedical Eng.', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'hospital_staff':
        return { title: 'Hospital Staff', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { title: 'User', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleLabel(user?.role);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            EquipSure
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              PRO
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-500" /> St. Jude Memorial Hospital
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-100" />}
            </button>
          );
        })}

        {/* Quick Demo Switcher */}
        <div className="pt-5 mt-4 border-t border-slate-800/80 px-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-teal-400" /> Switch Demo Role
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => quickDemoLogin('admin')}
              className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-between ${
                user?.role === 'admin'
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>👑 Admin</span>
              {user?.role === 'admin' && <span className="text-[9px] bg-purple-500 text-white px-1.5 rounded">Active</span>}
            </button>

            <button
              onClick={() => quickDemoLogin('biomedical_engineer')}
              className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-between ${
                user?.role === 'biomedical_engineer'
                  ? 'bg-teal-950/60 text-teal-300 border border-teal-800/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🔬 Biomedical Eng.</span>
              {user?.role === 'biomedical_engineer' && <span className="text-[9px] bg-teal-500 text-white px-1.5 rounded">Active</span>}
            </button>

            <button
              onClick={() => quickDemoLogin('hospital_staff')}
              className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-between ${
                user?.role === 'hospital_staff'
                  ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🩺 Hospital Staff</span>
              {user?.role === 'hospital_staff' && <span className="text-[9px] bg-blue-500 text-white px-1.5 rounded">Active</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Guest User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                {roleInfo.title}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
