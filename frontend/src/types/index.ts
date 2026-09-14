export type UserRole = 'admin' | 'biomedical_engineer' | 'hospital_staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
}

export type EquipmentStatus = 'operational' | 'under_maintenance' | 'under_repair' | 'needs_calibration' | 'decommissioned';
export type Criticality = 'high' | 'medium' | 'low';

export interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  department: string;
  location_room: string;
  purchase_date: string;
  purchase_cost: number | string;
  warranty_expiry: string;
  status: EquipmentStatus;
  criticality: Criticality;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type MaintenanceFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

export interface ChecklistItem {
  task: string;
  done: boolean;
}

export interface MaintenanceSchedule {
  id: number;
  equipment_id: number;
  title: string;
  frequency: MaintenanceFrequency;
  last_maintenance_date?: string | null;
  next_maintenance_date: string;
  status: MaintenanceStatus;
  checklist?: ChecklistItem[];
  performed_by?: number | null;
  notes?: string;
  equipment_name?: string;
  equipment_code?: string;
  department?: string;
  location_room?: string;
  model?: string;
  manufacturer?: string;
  performed_by_name?: string;
  created_at?: string;
}

export type CalibrationStatus = 'passed' | 'failed' | 'due_soon' | 'overdue';

export interface Calibration {
  id: number;
  equipment_id: number;
  certificate_number: string;
  calibration_date: string;
  next_due_date: string;
  status: CalibrationStatus;
  standard_used: string;
  accuracy_drift?: string;
  calibrated_by: string;
  remarks?: string;
  equipment_name?: string;
  equipment_code?: string;
  department?: string;
  location_room?: string;
  model?: string;
  manufacturer?: string;
  created_at?: string;
}

export type ContractType = 'OEM_Standard' | 'AMC' | 'CMC' | 'Extended';
export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired';

export interface Warranty {
  id: number;
  equipment_id: number;
  provider_name: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  coverage_terms?: string;
  annual_cost: number | string;
  status: WarrantyStatus;
  days_remaining?: number;
  equipment_name?: string;
  equipment_code?: string;
  department?: string;
  location_room?: string;
  manufacturer?: string;
  model?: string;
}

export type ServicePriority = 'critical' | 'high' | 'medium' | 'low';
export type ServiceStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface ServiceRequest {
  id: number;
  ticket_number: string;
  equipment_id: number;
  reported_by: number;
  priority: ServicePriority;
  issue_description: string;
  assigned_to?: number | null;
  status: ServiceStatus;
  resolution_details?: string | null;
  spare_parts_used?: string | null;
  repair_cost: number | string;
  downtime_hours: number | string;
  reported_at: string;
  resolved_at?: string | null;
  equipment_name?: string;
  equipment_code?: string;
  department?: string;
  location_room?: string;
  manufacturer?: string;
  model?: string;
  reporter_name?: string;
  reporter_role?: string;
  technician_name?: string;
}

export type StressLevel = 'underutilized' | 'optimal' | 'overused';

export interface UtilizationLog {
  id: number;
  equipment_id: number;
  log_date: string;
  operating_hours: number;
  idle_hours: number;
  patients_served: number;
  utilization_rate: number;
  stress_level: StressLevel;
  logged_by?: number | null;
  equipment_name?: string;
  equipment_code?: string;
  department?: string;
  location_room?: string;
  category?: string;
  logged_by_name?: string;
}

export interface Notification {
  id: number;
  user_id?: number | null;
  type: 'maintenance_due' | 'calibration_due' | 'warranty_expiry' | 'service_request' | 'system_alert';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalEquipment: number;
  totalAssetValue: number;
  operational: number;
  underMaintenance: number;
  underRepair: number;
  needsCalibration: number;
  decommissioned: number;
  maintenanceDue: number;
  calibrationDue: number;
  warrantyExpiring: number;
  openTickets: number;
  operationalRate: number;
}
