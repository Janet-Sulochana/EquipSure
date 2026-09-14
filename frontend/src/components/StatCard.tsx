import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'teal' | 'blue' | 'amber' | 'rose' | 'purple' | 'emerald';
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'teal',
  badge,
  onClick,
}) => {
  const variantStyles = {
    teal: {
      bg: 'bg-teal-50 text-teal-600',
      border: 'hover:border-teal-300',
      badge: 'bg-teal-100 text-teal-800',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-300',
      badge: 'bg-blue-100 text-blue-800',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-300',
      badge: 'bg-amber-100 text-amber-800',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'hover:border-rose-300',
      badge: 'bg-rose-100 text-rose-800',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-300',
      badge: 'bg-purple-100 text-purple-800',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 ${
        onClick ? `cursor-pointer hover:shadow-md ${style.border}` : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl ${style.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
