import React from 'react';
import { EquipmentStatus, Criticality, MaintenanceStatus, CalibrationStatus, WarrantyStatus, ServicePriority } from '../types';

interface StatusBadgeProps {
  status?: EquipmentStatus | MaintenanceStatus | CalibrationStatus | WarrantyStatus | ServicePriority | string;
  type?: 'status' | 'criticality' | 'priority' | 'contract';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'operational', type = 'status', size = 'md' }) => {
  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status;

  if (type === 'criticality') {
    switch (normalized) {
      case 'high':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = 'High Criticality';
        break;
      case 'medium':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        label = 'Medium Criticality';
        break;
      case 'low':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = 'Low Criticality';
        break;
    }
  } else if (type === 'priority') {
    switch (normalized) {
      case 'critical':
        colorClasses = 'bg-red-100 text-red-800 border-red-300 font-semibold animate-pulse';
        dotColor = 'bg-red-600';
        label = 'Critical Priority';
        break;
      case 'high':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = 'High Priority';
        break;
      case 'medium':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        label = 'Medium Priority';
        break;
      case 'low':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        dotColor = 'bg-slate-400';
        label = 'Low Priority';
        break;
    }
  } else {
    switch (normalized) {
      case 'operational':
      case 'passed':
      case 'completed':
      case 'active':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = normalized === 'operational' ? 'Operational' : (normalized === 'passed' ? 'Passed' : (normalized === 'completed' ? 'Completed' : 'Active'));
        break;
      case 'under_maintenance':
      case 'in_progress':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-500';
        label = normalized === 'under_maintenance' ? 'In Maintenance' : 'In Progress';
        break;
      case 'under_repair':
      case 'failed':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = normalized === 'under_repair' ? 'Under Repair' : 'Failed Calibration';
        break;
      case 'needs_calibration':
      case 'due_soon':
      case 'expiring_soon':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        label = normalized === 'needs_calibration' ? 'Needs Calibration' : (normalized === 'expiring_soon' ? 'Expiring Soon' : 'Due Soon');
        break;
      case 'overdue':
      case 'expired':
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        dotColor = 'bg-red-500';
        label = normalized === 'overdue' ? 'Overdue' : 'Expired';
        break;
      case 'decommissioned':
      case 'closed':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
        label = normalized === 'decommissioned' ? 'Decommissioned' : 'Closed';
        break;
      case 'scheduled':
      case 'assigned':
      case 'reported':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        dotColor = 'bg-purple-500';
        label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        break;
      default:
        label = String(status);
    }
  }

  const paddingClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${paddingClasses} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
