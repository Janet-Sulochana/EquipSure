import React, { useState, useEffect } from 'react';
import { Bell, Database, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/client';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();
  const [systemHealth, setSystemHealth] = useState<{ db: string; redis: string }>({
    db: 'connected',
    redis: 'active',
  });

  useEffect(() => {
    api.get('/system/status').then(res => {
      if (res.data) {
        setSystemHealth({
          db: res.data.database?.status || 'connected',
          redis: res.data.cache?.connected ? 'Redis Native' : 'Cache Fallback',
        });
      }
    }).catch(() => {});
  }, []);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Healthcare Dashboard', sub: 'Real-time biomedical telemetry & fleet compliance' };
      case 'equipment':
        return { title: 'Biomedical Equipment Inventory', sub: 'Complete device registry, lifecycle & location tracking' };
      case 'maintenance':
        return { title: 'Preventive Maintenance (PPM)', sub: 'Inspection schedules, recurrence cycles & safety tasklists' };
      case 'calibrations':
        return { title: 'Calibration & Metrology Records', sub: 'Traceable ISO standards, accuracy drift & compliance audits' };
      case 'warranties':
        return { title: 'Warranty & Service Contracts', sub: 'OEM, AMC, and CMC contracts with upcoming expiry alerts' };
      case 'service-requests':
        return { title: 'Breakdown & Repair History', sub: 'Clinical incident logging, engineer work orders & downtime logs' };
      case 'utilization':
        return { title: 'Asset Utilization Tracking', sub: 'Operating load, patient volume & duty-cycle analytics' };
      case 'reports':
        return { title: 'Compliance Reports & Analytics', sub: 'Audit-ready summaries, department metrics & CSV export' };
      case 'users':
        return { title: 'Hospital Staff Directory & Access Control', sub: 'Clinical personnel, biomedical engineers, and system roles' };
      default:
        return { title: 'Biomedical System', sub: 'St. Jude Memorial Hospital' };
    }
  };

  const headerInfo = getTabTitle(activeTab);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Title & Subtitle */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{headerInfo.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{headerInfo.sub}</p>
        </div>

        {/* Right Section: System Pills, Notifications & User Avatar */}
        <div className="flex items-center gap-4">
          {/* PostgreSQL & Redis Status Chips */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Postgres 18</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Redis Cache</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 transition"
            title="View hospital alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-teal-600 font-semibold">{user?.department}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
