-- EquipSure Realistic Seed Data for Hospitals
-- Biomedical Equipment, Schedules, Calibrations, Warranties, Service Requests, Utilization

-- Demo Users (Password: 'Password123!' hashed with bcrypt 10 rounds: $2a$10$7Zk7G1r7s79q4k1/q5Qf7.20d9Wb8m7Z3o6UvBvJ0H7u5u2R7i9yG or bcryptjs hash)
-- We will insert standard bcrypt hash for 'Password123!' -> $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJmGWD9WZg66Tehm

INSERT INTO users (id, name, email, password_hash, role, department, phone) VALUES
(1, 'Dr. Eleanor Vance', 'admin@equipsure.com', '$2a$10$F.fD.RM.Qp9OOj4tiGdCKuqtqrhobQfd9fqoYYYVqgWgKOeF3UJuy', 'admin', 'Biomedical Administration', '+1-555-0190'),
(2, 'Marcus Reynolds, CBET', 'bme@equipsure.com', '$2a$10$F.fD.RM.Qp9OOj4tiGdCKuqtqrhobQfd9fqoYYYVqgWgKOeF3UJuy', 'biomedical_engineer', 'Clinical Engineering', '+1-555-0191'),
(3, 'Nurse Sarah Jenkins, RN', 'staff@equipsure.com', '$2a$10$F.fD.RM.Qp9OOj4tiGdCKuqtqrhobQfd9fqoYYYVqgWgKOeF3UJuy', 'hospital_staff', 'Intensive Care Unit', '+1-555-0192'),
(4, 'Dr. Arjun Patel, MD', 'doctor@equipsure.com', '$2a$10$F.fD.RM.Qp9OOj4tiGdCKuqtqrhobQfd9fqoYYYVqgWgKOeF3UJuy', 'hospital_staff', 'Radiology & Imaging', '+1-555-0193')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Equipment Inventory (20 Lifesaving & Critical Hospital Assets)
INSERT INTO equipment (id, equipment_code, name, category, manufacturer, model, serial_number, department, location_room, purchase_date, purchase_cost, warranty_expiry, status, criticality, notes) VALUES
(1, 'EQ-RAD-1001', '1.5T MRI Scanner', 'Diagnostic Imaging', 'Siemens Healthineers', 'MAGNETOM Altea 1.5T', 'SN-MR-88301', 'Radiology', 'MRI Suite 1', '2023-01-15', 1250000.00, '2026-01-14', 'operational', 'high', 'Liquid helium level monitored weekly. Bio-compatible shielding inspected.'),
(2, 'EQ-RAD-1002', '128-Slice CT Scanner', 'Diagnostic Imaging', 'GE Healthcare', 'Revolution EVO', 'SN-CT-44219', 'Radiology', 'CT Room A', '2023-04-10', 820000.00, '2026-04-09', 'operational', 'high', 'High-speed dual-energy detector array with low-dose ASiR-V protocol.'),
(3, 'EQ-ICU-2001', 'High-End ICU Ventilator', 'Life Support', 'Hamilton Medical', 'Hamilton-C6', 'SN-VEN-90112', 'ICU', 'Bed 101 - Isolation', '2024-02-18', 42000.00, '2027-02-17', 'operational', 'high', 'Equipped with INTELLiVENT-ASV adaptive ventilation and transpulmonary pressure monitoring.'),
(4, 'EQ-ICU-2002', 'High-End ICU Ventilator', 'Life Support', 'Hamilton Medical', 'Hamilton-C6', 'SN-VEN-90115', 'ICU', 'Bed 104', '2024-02-18', 42000.00, '2027-02-17', 'under_maintenance', 'high', 'Scheduled for O2 sensor replacement and flow sensor calibration.'),
(5, 'EQ-EMG-3001', 'Biphasic Defibrillator & Monitor', 'Life Support', 'ZOLL Medical', 'R Series Plus', 'SN-DEF-55120', 'Emergency', 'Crash Cart ER-1', '2023-09-01', 18500.00, '2026-09-01', 'operational', 'high', 'Real CPR Help feedback active. Self-test passed daily at 03:00 AM.'),
(6, 'EQ-EMG-3002', 'Automated External Defibrillator', 'Life Support', 'Philips Healthcare', 'HeartStart FRx', 'SN-DEF-77291', 'Emergency', 'Trauma Bay 2', '2022-11-20', 3200.00, '2025-11-19', 'needs_calibration', 'high', 'Pads expiring; annual joule discharge calibration required.'),
(7, 'EQ-ICU-2003', 'Multiparameter Patient Monitor', 'Patient Monitoring', 'Mindray', 'BeneVision N17', 'SN-MON-61022', 'ICU', 'Bay 2 Bed 108', '2023-06-12', 14500.00, '2026-06-11', 'operational', 'medium', 'Configured with SpO2, 12-lead ECG, NIBP, Dual IBP, and EtCO2 modules.'),
(8, 'EQ-CAR-4001', 'Echocardiography System', 'Diagnostic Imaging', 'Philips Healthcare', 'EPIQ Elite Cardiology', 'SN-US-33100', 'Cardiology', 'Echo Lab Room 2B', '2023-08-25', 165000.00, '2026-08-24', 'operational', 'high', 'X5-1 and S5-1 cardiac transducers paired. Live 3D TEE probe inspected.'),
(9, 'EQ-SUR-5001', '4K UHD Laparoscopic Surgery Tower', 'Surgical', 'Stryker', '1688 AIM 4K', 'SN-SUR-11009', 'Surgery', 'OR Suite 3', '2024-01-05', 135000.00, '2027-01-04', 'operational', 'high', 'Fluorescence imaging mode (SPY-PHI) enabled with pneumo-insuflator.'),
(10, 'EQ-SUR-5002', 'Anesthesia Delivery Workstation', 'Life Support', 'Dräger', 'Primus Infinity', 'SN-ANE-49201', 'Surgery', 'OR Suite 1', '2022-05-14', 68000.00, '2025-05-13', 'under_repair', 'high', 'Vaporizer interlocking mechanism sticking; awaiting replacement valve assembly.'),
(11, 'EQ-DIA-6001', 'Hemodialysis System', 'Therapeutic', 'Fresenius Medical Care', '5008S CorDiax', 'SN-DIA-77182', 'Dialysis', 'Station 4', '2023-10-02', 38000.00, '2026-10-01', 'operational', 'high', 'Online Hemodiafiltration (HDF) enabled. Disinfection routine run after each shift.'),
(12, 'EQ-DIA-6002', 'Hemodialysis System', 'Therapeutic', 'Fresenius Medical Care', '5008S CorDiax', 'SN-DIA-77183', 'Dialysis', 'Station 6', '2023-10-02', 38000.00, '2026-10-01', 'operational', 'high', 'Daily chemical rinse and heat disinfection verified.'),
(13, 'EQ-RAD-1003', 'Mobile Digital X-Ray System', 'Diagnostic Imaging', 'Shimadzu', 'MobileDaRt Evolution MX8', 'SN-XR-99411', 'Radiology', 'Mobile Unit - Ward 4', '2022-07-29', 140000.00, '2025-07-28', 'operational', 'medium', 'Equipped with wireless Cesium Iodide flat panel detector.'),
(14, 'EQ-LAB-7001', 'Automated Hematology Analyzer', 'Laboratory', 'Sysmex', 'XN-1000', 'SN-LAB-22340', 'Pathology', 'Clinical Hematology Lab', '2023-03-14', 92000.00, '2026-03-13', 'operational', 'medium', 'Complete blood count + 5-part differential. Daily tri-level QC run.'),
(15, 'EQ-LAB-7002', 'Critical Care Blood Gas Analyzer', 'Laboratory', 'Radiometer', 'ABL90 FLEX PLUS', 'SN-LAB-55829', 'Pathology', 'Stat Lab - 2nd Floor', '2024-05-10', 29000.00, '2027-05-09', 'operational', 'high', 'Automatic sensor cassette replacement every 30 days. Calibrated continuously.'),
(16, 'EQ-NEO-8001', 'Infant Intensive Care Incubator', 'Life Support', 'Atom Medical', 'Dual Incu i', 'SN-INC-00219', 'Pediatrics', 'NICU Pod B', '2023-12-01', 34000.00, '2026-11-30', 'operational', 'high', 'Integrated pulse oximeter and servo-controlled skin temperature probes.'),
(17, 'EQ-CSS-9001', 'Pre-Vacuum Steam Sterilizer Autoclave', 'Surgical', 'Tuttnauer', 'T-Top 3870E', 'SN-STE-88190', 'CSSD', 'Sterile Processing Dept', '2022-03-20', 48000.00, '2025-03-19', 'operational', 'medium', 'Biological indicator spore testing logged daily; vacuum leak test passed.'),
(18, 'EQ-ICU-2004', 'Volumetric Infusion Pump', 'Therapeutic', 'Baxter Healthcare', 'Spectrum IQ', 'SN-PMP-11200', 'ICU', 'Stepdown Unit 302', '2023-05-11', 4800.00, '2026-05-10', 'operational', 'medium', 'Dose error reduction system (DERS) drug library version 14.2 installed.'),
(19, 'EQ-ICU-2005', 'Volumetric Infusion Pump', 'Therapeutic', 'Baxter Healthcare', 'Spectrum IQ', 'SN-PMP-11201', 'ICU', 'Stepdown Unit 305', '2023-05-11', 4800.00, '2026-05-10', 'needs_calibration', 'medium', 'Flow rate accuracy drift (+6.2%) noted during bi-annual check.'),
(20, 'EQ-SUR-5003', 'Mobile Surgical C-Arm System', 'Surgical', 'GE Healthcare', 'OEC One CFD', 'SN-CARM-67319', 'Surgery', 'Hybrid OR 2', '2023-09-15', 178000.00, '2026-09-14', 'operational', 'high', 'High resolution CMOS flat detector, low dose fluoroscopy profile.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));

-- Preventive Maintenance Schedules
INSERT INTO maintenance_schedules (id, equipment_id, title, frequency, last_maintenance_date, next_maintenance_date, status, checklist, performed_by, notes) VALUES
(1, 1, 'Quarterly RF Coil & Cryogenic Helium Check', 'quarterly', '2026-06-15', '2026-09-20', 'scheduled', '[{"task": "Inspect magnet helium level (>70%)", "done": false}, {"task": "Gradient coil signal-to-noise check", "done": false}, {"task": "Patient table hydraulic check", "done": false}, {"task": "Emergency quench button audit", "done": false}]'::jsonb, 2, 'Preventive inspection by Siemens certified technician scheduled.'),
(2, 2, 'Semi-Annual Slip Ring & Detector Calibration', 'semi_annual', '2026-03-10', '2026-09-10', 'overdue', '[{"task": "Clean high voltage slip rings", "done": true}, {"task": "Verify laser positioning lights", "done": true}, {"task": "Inspect collimator accuracy", "done": false}, {"task": "CTDI dose verification phantom", "done": false}]'::jsonb, 2, 'Overdue by 4 days due to heavy emergency trauma workload. High priority.'),
(3, 3, 'Annual Comprehensive Overhaul & O2 Sensor', 'annual', '2025-09-18', '2026-09-18', 'scheduled', '[{"task": "Replace O2 fuel cell", "done": false}, {"task": "Test flow sensors", "done": false}, {"task": "Calibrate expiratory valve", "done": false}, {"task": "Inspect battery backup duration", "done": false}]'::jsonb, 2, 'Hamilton overhaul kit in stock.'),
(4, 4, 'Quarterly Expiratory Valve Assembly Service', 'quarterly', '2026-05-12', '2026-08-12', 'in_progress', '[{"task": "Disassemble and autoclave valve housing", "done": true}, {"task": "Replace silicone membrane", "done": true}, {"task": "Run system tightness test", "done": false}]'::jsonb, 2, 'PPM currently on bench in BME workshop.'),
(5, 5, 'Bi-Annual Defibrillator Energy Discharge Test', 'semi_annual', '2026-03-01', '2026-09-01', 'overdue', '[{"task": "Test 50J, 100J, 200J energy output on analyzer", "done": false}, {"task": "Measure pacing pulse rate & current", "done": false}, {"task": "Inspect CPR sensor accuracy", "done": false}]'::jsonb, 2, 'Test with Fluke Impulse 7000DP defibrillator analyzer.'),
(6, 7, 'Annual Electrical Safety & Leakage Inspection', 'annual', '2025-10-15', '2026-10-15', 'scheduled', '[{"task": "Earth resistance test (<0.2 ohm)", "done": false}, {"task": "Chassis leakage current test (<100 uA)", "done": false}, {"task": "Patient lead leakage test (<10 uA)", "done": false}]'::jsonb, 2, 'IEC 62353 safety standards audit.'),
(7, 10, 'Semi-Annual Anesthesia Vaporizer Servicing', 'semi_annual', '2026-04-05', '2026-10-05', 'scheduled', '[{"task": "Sevoflurane vaporizer concentration check", "done": false}, {"task": "Ventilator bellows leak test", "done": false}, {"task": "Scavenging system vacuum flow check", "done": false}]'::jsonb, 2, 'Coincides with manufacturer service window.'),
(8, 11, 'Monthly Water Quality & Endotoxin Ultrafilter Check', 'monthly', '2026-08-14', '2026-09-14', 'completed', '[{"task": "Check DI water conductivity", "done": true}, {"task": "Verify ultrafilter pressure drop", "done": true}, {"task": "Log post-treatment chlorine level", "done": true}]'::jsonb, 2, 'All parameters strictly within AAMI water standards.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('maintenance_schedules_id_seq', (SELECT MAX(id) FROM maintenance_schedules));

-- Calibrations
INSERT INTO calibrations (id, equipment_id, certificate_number, calibration_date, next_due_date, status, standard_used, accuracy_drift, calibrated_by, remarks) VALUES
(1, 1, 'CAL-2026-MR01', '2025-09-20', '2026-09-20', 'due_soon', 'ACR Magnetic Resonance Standard', '+0.12% Field Homogeneity', 'Siemens Metrology Services', 'Homogeneity within 1.5 ppm over 45cm DSV. Meets OEM specification.'),
(2, 2, 'CAL-2026-CT01', '2026-04-10', '2027-04-10', 'passed', 'AAPM TG-66 / IEC 61223-3-5', 'Hounsfield Unit drift 0.4 HU', 'GE Global Metrology Lab', 'Water phantom measured at 0.1 HU (ref 0 HU). Slice thickness deviation <0.3mm.'),
(3, 5, 'CAL-2026-DEF05', '2025-09-02', '2026-09-02', 'overdue', 'AAMI DF80 / IEC 60601-2-4', 'Energy drift +3.8%', 'Clinical Engineering In-House', 'Due for annual energy verification on Fluke analyzer.'),
(4, 6, 'CAL-2025-DEF12', '2025-08-10', '2026-08-10', 'overdue', 'AAMI DF80 Cardiac Standards', 'Pacing drift +6.1%', 'Biomedical Engineering Unit', 'Requires full discharge re-calibration.'),
(5, 7, 'CAL-2026-MON03', '2026-06-12', '2027-06-12', 'passed', 'NIST Traceable SpO2 / NIBP Calibrator', 'NIBP +/- 1.2 mmHg, SpO2 +/- 0.5%', 'Marcus Reynolds, CBET', 'Calibrated using Fluke ProSim 8 Vital Signs Simulator. Passed with distinction.'),
(6, 11, 'CAL-2026-DIA01', '2026-08-14', '2027-02-14', 'passed', 'ISO 13958 Dialysis Fluid Standards', 'Conductivity 13.98 mS/cm', 'Marcus Reynolds, CBET', 'Dialysate temperature 37.0 C, flow 500 mL/min calibrated accurately.'),
(7, 15, 'CAL-2026-LAB09', '2026-08-01', '2026-11-01', 'passed', 'CLSI C46-A2 Blood Gas Standards', 'pH +/- 0.004, pO2 +/- 1.1 mmHg', 'Radiometer Automated Metrology', 'Internal 4-point auto-calibration performed continuously.'),
(8, 19, 'CAL-2026-PMP04', '2026-05-11', '2026-08-11', 'failed', 'AAMI ID26 Infusion Device Testing', '+6.2% Flow Rate Drift (Tolerance: +/-5%)', 'Biomedical Engineering Unit', 'Flow drift exceeded allowable clinical threshold. Flagged for recalibration.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('calibrations_id_seq', (SELECT MAX(id) FROM calibrations));

-- Warranties & Service Contracts
INSERT INTO warranties (id, equipment_id, provider_name, contract_type, start_date, end_date, contact_person, contact_phone, contact_email, coverage_terms, annual_cost, status) VALUES
(1, 1, 'Siemens Healthineers Customer Care', 'CMC', '2023-01-15', '2026-01-14', 'David Miller', '+1-800-888-7436', 'service@siemens-healthineers.com', 'Comprehensive Comprehensive Maintenance Contract (CMC). Includes vacuum, cryogen top-ups, magnet coils, and 24/7 on-site response within 2 hours.', 75000.00, 'expiring_soon'),
(2, 2, 'GE Healthcare Gold Protection', 'CMC', '2023-04-10', '2026-04-09', 'Patricia Wong', '+1-800-437-1171', 'service@gehealthcare.com', 'Full coverage including X-ray tube replacement, detector elements, software patches, and preventive maintenance.', 62000.00, 'active'),
(3, 3, 'Hamilton Medical TechCare', 'AMC', '2024-02-18', '2027-02-17', 'Kevin Novak', '+1-800-426-6331', 'support@hamilton-medical.com', 'Annual Maintenance Contract (AMC). Covers all labor, 2 scheduled PPM visits per year, firmware upgrades.', 3200.00, 'active'),
(4, 5, 'ZOLL Medical Technical Assurance', 'Extended', '2023-09-01', '2026-09-25', 'Rachel Green', '+1-800-348-9011', 'service@zoll.com', 'Extended warranty on mainboard, capacitor bank, and paddler assemblies.', 1400.00, 'expiring_soon'),
(5, 6, 'Philips HeartStart Warranty', 'OEM_Standard', '2022-11-20', '2025-11-19', 'Chris Evans', '+1-800-722-9377', 'medical@philips.com', 'Standard factory OEM parts and labor warranty.', 0.00, 'expired'),
(6, 8, 'Philips Diamond Select Care', 'CMC', '2023-08-25', '2026-08-24', 'Sarah Connors', '+1-800-722-9377', 'ultrasound.care@philips.com', 'Comprehensive probe protection: covers 1 accidental probe replacement per year.', 14500.00, 'expiring_soon'),
(7, 9, 'Stryker ProCare Premium', 'AMC', '2024-01-05', '2027-01-04', 'Jason Bourne', '+1-800-787-9537', 'procare@stryker.com', 'All visual optics, camera heads, and light cables covered with next-day swap.', 9800.00, 'active'),
(8, 11, 'Fresenius CarePlus', 'CMC', '2023-10-02', '2026-10-01', 'Emily Stone', '+1-800-323-5188', 'dialysis-support@fmc-na.com', 'Complete hydraulic, blood pump, and ultrafiltration component coverage.', 4500.00, 'active')
ON CONFLICT (id) DO NOTHING;

SELECT setval('warranties_id_seq', (SELECT MAX(id) FROM warranties));

-- Service Requests & Breakdown History
INSERT INTO service_requests (id, ticket_number, equipment_id, reported_by, priority, issue_description, assigned_to, status, resolution_details, spare_parts_used, repair_cost, downtime_hours, reported_at, resolved_at) VALUES
(1, 'SR-2026-0038', 10, 3, 'critical', 'Anesthesia delivery workstation vaporizer interlocking mechanism is jamming when switching from Isoflurane to Sevoflurane.', 2, 'in_progress', 'Inspected Selectatec manifold. Found debris and worn O-ring seal. Ordering replacement Dräger manifold seal kit.', 'Dräger Selectatec O-Ring Kit #M34882', 450.00, 16.50, '2026-09-12 08:30:00+00', NULL),
(2, 'SR-2026-0039', 4, 3, 'high', 'Ventilator touch screen is intermittently non-responsive in bottom-left corner near alarm silence key.', 2, 'assigned', 'Assigned to Biomedical Engineer Marcus Reynolds. Diagnostic touchscreen test to be performed.', NULL, 0.00, 4.00, '2026-09-13 14:15:00+00', NULL),
(3, 'SR-2026-0035', 19, 3, 'medium', 'Infusion pump flow rate warning during vancomycin delivery. Suspect occlusion sensor glitch.', 2, 'reported', 'Reported by nursing staff; pump quarantined in dirty utility holding area.', NULL, 0.00, 2.00, '2026-09-14 09:00:00+00', NULL),
(4, 'SR-2026-0028', 13, 4, 'medium', 'Mobile X-ray drive motor stuttering when navigating threshold ramp to 3rd floor ward.', 2, 'resolved', 'Cleaned drive wheel gear assembly, calibrated joystick deadband, and lubricated motor axle bearings.', 'Drive motor bearing lube, potentiometer connector clean', 320.00, 8.00, '2026-09-05 11:20:00+00', '2026-09-06 14:00:00+00'),
(5, 'SR-2026-0021', 1, 4, 'critical', 'Cold head compressor abnormal acoustic vibration and water chiller temperature spike.', 2, 'closed', 'Sumitomo F-70 cold head adsorber replaced. Chiller closed-loop refrigerant recharged to 22 bar.', 'Cryogenic Adsorber Filter #CS-890, R407C Refrigerant', 4800.00, 24.00, '2026-08-20 06:10:00+00', '2026-08-21 07:30:00+00'),
(6, 'SR-2026-0015', 7, 3, 'low', 'ECG trunk cable locking clip cracked at monitor junction.', 2, 'closed', 'Replaced 12-lead ECG trunk cable with OEM Mindray replacement part.', 'Mindray 12-Lead ECG Trunk Cable #0010-30-42719', 180.00, 1.50, '2026-08-10 16:00:00+00', '2026-08-10 17:45:00+00')
ON CONFLICT (id) DO NOTHING;

SELECT setval('service_requests_id_seq', (SELECT MAX(id) FROM service_requests));

-- Utilization Logs
INSERT INTO utilization_logs (id, equipment_id, log_date, operating_hours, idle_hours, patients_served, utilization_rate, stress_level, logged_by) VALUES
(1, 1, '2026-09-13', 18.5, 5.5, 26, 77.08, 'optimal', 2),
(2, 1, '2026-09-12', 20.0, 4.0, 29, 83.33, 'overused', 2),
(3, 2, '2026-09-13', 21.5, 2.5, 42, 89.58, 'overused', 2),
(4, 2, '2026-09-12', 22.0, 2.0, 45, 91.67, 'overused', 2),
(5, 3, '2026-09-13', 24.0, 0.0, 1, 100.00, 'overused', 2),
(6, 4, '2026-09-13', 0.0, 24.0, 0, 0.00, 'underutilized', 2),
(7, 5, '2026-09-13', 2.0, 22.0, 2, 8.33, 'underutilized', 2),
(8, 8, '2026-09-13', 12.0, 12.0, 16, 50.00, 'optimal', 2),
(9, 9, '2026-09-13', 14.5, 9.5, 5, 60.42, 'optimal', 2),
(10, 11, '2026-09-13', 16.0, 8.0, 4, 66.67, 'optimal', 2),
(11, 12, '2026-09-13', 16.0, 8.0, 4, 66.67, 'optimal', 2),
(12, 13, '2026-09-13', 9.0, 15.0, 22, 37.50, 'optimal', 2),
(13, 14, '2026-09-13', 18.0, 6.0, 140, 75.00, 'optimal', 2),
(14, 15, '2026-09-13', 24.0, 0.0, 68, 100.00, 'overused', 2),
(15, 20, '2026-09-13', 10.5, 13.5, 6, 43.75, 'optimal', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('utilization_logs_id_seq', (SELECT MAX(id) FROM utilization_logs));

-- Notifications
INSERT INTO notifications (id, user_id, type, title, message, link, is_read) VALUES
(1, NULL, 'maintenance_due', 'Preventive Maintenance Overdue: CT Scanner', 'Semi-Annual Slip Ring & Detector Calibration for GE Revolution EVO (EQ-RAD-1002) is overdue by 4 days.', '/maintenance', false),
(2, NULL, 'service_request', 'Critical Breakdown Reported: OR Suite 1', 'Anesthesia Workstation (EQ-SUR-5002) vaporizer jamming. Ticket #SR-2026-0038 is in progress.', '/service-requests', false),
(3, NULL, 'calibration_due', 'Calibration Due Soon: 1.5T MRI Scanner', 'ACR Magnetic Resonance Standard calibration for MAGNETOM Altea 1.5T expires in 6 days.', '/calibrations', false),
(4, NULL, 'warranty_expiry', 'Warranty Expiring: ZOLL R Series Defibrillator', 'Extended warranty contract with ZOLL Medical expires in 11 days. Renewal review needed.', '/warranties', false),
(5, 2, 'maintenance_due', 'Scheduled Maintenance: 1.5T MRI Scanner', 'Quarterly RF Coil & Cryogenic Helium check scheduled for 2026-09-20.', '/maintenance', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
