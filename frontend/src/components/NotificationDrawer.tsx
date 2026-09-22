import React from 'react';
import { X, Check, Bell, AlertTriangle, ShieldAlert, Calendar, Wrench, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../types';

interface NotificationDrawerProps {
  onNavigate?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'maintenance_due':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'calibration_due':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'warranty_expiry':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'service_request':
        return <AlertTriangle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-teal-600" />;
    }
  };

  const handleClickItem = (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.link && onNavigate) {
      const tab = n.link.replace('/', '');
      onNavigate(tab);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Alerts</h2>
                <p className="text-xs text-slate-500">
                  {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <CheckCheck className="w-4 h-4" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-sm font-medium">No alerts at this moment</p>
                <p className="text-xs text-slate-400 mt-1">All hospital biomedical devices are within operating parameters.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                    n.is_read
                      ? 'bg-white border-slate-200/70 hover:border-slate-300'
                      : 'bg-teal-50/40 border-teal-200/80 hover:border-teal-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-white shadow-xs border border-slate-100">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-semibold truncate ${n.is_read ? 'text-slate-800' : 'text-teal-950 font-bold'}`}>
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Redis Badge */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Redis Notification Bus Active
            </span>
            <span className="font-mono text-[11px]">EquipSure Core</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
