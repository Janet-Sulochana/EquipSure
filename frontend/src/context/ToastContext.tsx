import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (arg1: string, arg2?: ToastType | string, arg3?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((arg1: string, arg2?: ToastType | string, arg3?: string) => {
    let type: ToastType = 'success';
    let title: string | undefined = undefined;
    let message: string = '';

    if (arg1 === 'success' || arg1 === 'error' || arg1 === 'info') {
      type = arg1;
      if (arg3 !== undefined) {
        title = arg2;
        message = arg3;
      } else {
        message = arg2 || '';
      }
    } else {
      message = arg1;
      if (arg2 === 'success' || arg2 === 'error' || arg2 === 'info') {
        type = arg2;
      }
      title = arg3;
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950/90 border-emerald-700/80 text-white shadow-emerald-950/40',
            error: 'bg-rose-950/90 border-rose-700/80 text-white shadow-rose-950/40',
            info: 'bg-slate-900/95 border-slate-700/80 text-white shadow-slate-950/40',
          }[toast.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            info: 'text-teal-400',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 text-xs ${typeStyles}`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex flex-col min-w-0">
                  {toast.title && <span className="font-bold text-xs leading-tight mb-0.5">{toast.title}</span>}
                  <span className="text-[11px] opacity-90 leading-normal">{toast.message}</span>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
