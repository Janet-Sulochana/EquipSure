-- EquipSure Database Schema
-- Biomedical Equipment Management System (PERN Stack)

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    floor_building VARCHAR(100) NOT NULL,
    head_of_department VARCHAR(100),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'biomedical_engineer', 'hospital_staff')),
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    location_room VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(12, 2) DEFAULT 0.00,
    warranty_expiry DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'under_maintenance', 'under_repair', 'needs_calibration', 'decommissioned')),
    criticality VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (criticality IN ('high', 'medium', 'low')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    last_maintenance_date DATE,
    next_maintenance_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue')),
    checklist JSONB DEFAULT '[]'::jsonb,
    performed_by INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibrations (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) NOT NULL,
    calibration_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'failed', 'due_soon', 'overdue')),
    standard_used VARCHAR(150) NOT NULL,
    accuracy_drift VARCHAR(100),
    calibrated_by VARCHAR(150) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    provider_name VARCHAR(150) NOT NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('OEM_Standard', 'AMC', 'CMC', 'Extended')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(150),
    coverage_terms TEXT,
    annual_cost NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    reported_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    issue_description TEXT NOT NULL,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved', 'closed')),
    resolution_details TEXT,
    spare_parts_used TEXT,
    repair_cost NUMERIC(10, 2) DEFAULT 0.00,
    downtime_hours NUMERIC(6, 2) DEFAULT 0.00,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS utilization_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    operating_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    idle_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    patients_served INT NOT NULL DEFAULT 0,
    utilization_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    stress_level VARCHAR(30) NOT NULL DEFAULT 'optimal' CHECK (stress_level IN ('underutilized', 'optimal', 'overused')),
    logged_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance_due', 'calibration_due', 'warranty_expiry', 'service_request', 'system_alert')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(200),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_department ON equipment(department);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_date ON maintenance_schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_calibration_next_due ON calibrations(next_due_date);
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON warranties(end_date);
CREATE INDEX IF NOT EXISTS idx_service_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_utilization_equipment ON utilization_logs(equipment_id, log_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
