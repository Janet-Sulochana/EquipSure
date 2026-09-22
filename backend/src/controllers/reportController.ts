import { Request, Response } from 'express';
import pool from '../config/db.js';

export async function getMaintenanceReport(req: Request, res: Response) {
  try {
    const [summaryResult, complianceResult, frequencyResult] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int as total_schedules,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed,
          COUNT(CASE WHEN status = 'overdue' OR (next_maintenance_date < CURRENT_DATE AND status != 'completed') THEN 1 END)::int as overdue,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int as in_progress,
          COUNT(CASE WHEN status = 'scheduled' AND next_maintenance_date >= CURRENT_DATE THEN 1 END)::int as upcoming
        FROM maintenance_schedules
      `),
      pool.query(`
        SELECT 
          e.department,
          COUNT(ms.id)::int as total_tasks,
          COUNT(CASE WHEN ms.status = 'completed' THEN 1 END)::int as completed_tasks,
          ROUND(
            (COUNT(CASE WHEN ms.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(ms.id), 0)) * 100, 
            1
          ) as compliance_percentage
        FROM equipment e
        LEFT JOIN maintenance_schedules ms ON e.id = ms.equipment_id
        GROUP BY e.department
        ORDER BY compliance_percentage DESC NULLS LAST
      `),
      pool.query(`
        SELECT frequency, COUNT(*)::int as count 
        FROM maintenance_schedules 
        GROUP BY frequency
      `),
    ]);

    return res.json({
      success: true,
      report: {
        summary: summaryResult.rows[0],
        departmentCompliance: complianceResult.rows,
        frequencyDistribution: frequencyResult.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCalibrationReport(req: Request, res: Response) {
  try {
    const [summaryResult, standardResult, logsResult] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int as total_records,
          COUNT(CASE WHEN status = 'passed' THEN 1 END)::int as passed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END)::int as failed,
          COUNT(CASE WHEN status = 'overdue' OR (next_due_date < CURRENT_DATE AND status != 'passed') THEN 1 END)::int as overdue,
          COUNT(CASE WHEN status = 'due_soon' THEN 1 END)::int as due_soon
        FROM calibrations
      `),
      pool.query(`
        SELECT standard_used, COUNT(*)::int as devices_tested
        FROM calibrations
        GROUP BY standard_used
        ORDER BY devices_tested DESC
      `),
      pool.query(`
        SELECT 
          c.certificate_number,
          c.calibration_date,
          c.next_due_date,
          c.status,
          c.standard_used,
          c.accuracy_drift,
          c.calibrated_by,
          e.name as equipment_name,
          e.equipment_code,
          e.department
        FROM calibrations c
        JOIN equipment e ON c.equipment_id = e.id
        ORDER BY c.next_due_date ASC
      `),
    ]);

    const summary = summaryResult.rows[0];
    const complianceRate = summary.total_records > 0
      ? Math.round((summary.passed / summary.total_records) * 100)
      : 100;

    return res.json({
      success: true,
      report: {
        summary: { ...summary, complianceRate },
        standards: standardResult.rows,
        records: logsResult.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWarrantyReport(req: Request, res: Response) {
  try {
    const [summaryResult, contractTypeResult, listResult] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int as total_contracts,
          COUNT(CASE WHEN end_date >= CURRENT_DATE THEN 1 END)::int as active_contracts,
          COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END)::int as expired_contracts,
          COUNT(CASE WHEN end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END)::int as expiring_in_30_days,
          COALESCE(SUM(annual_cost), 0)::numeric as total_annual_commitment
        FROM warranties
      `),
      pool.query(`
        SELECT contract_type, COUNT(*)::int as count, COALESCE(SUM(annual_cost), 0)::numeric as total_cost
        FROM warranties
        GROUP BY contract_type
      `),
      pool.query(`
        SELECT 
          w.*,
          e.name as equipment_name,
          e.equipment_code,
          e.department,
          (w.end_date - CURRENT_DATE) as days_remaining
        FROM warranties w
        JOIN equipment e ON w.equipment_id = e.id
        ORDER BY w.end_date ASC
      `),
    ]);

    return res.json({
      success: true,
      report: {
        summary: summaryResult.rows[0],
        contractTypes: contractTypeResult.rows,
        warranties: listResult.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUtilizationReport(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        e.id as equipment_id,
        e.name as equipment_name,
        e.equipment_code,
        e.category,
        e.department,
        ROUND(AVG(u.utilization_rate), 1) as avg_utilization_rate,
        ROUND(AVG(u.operating_hours), 1) as avg_daily_operating_hours,
        SUM(u.patients_served)::int as total_patients_served,
        COUNT(u.id)::int as days_recorded,
        CASE 
          WHEN AVG(u.utilization_rate) < 20.0 THEN 'Underutilized'
          WHEN AVG(u.utilization_rate) > 80.0 THEN 'High Stress / Overused'
          ELSE 'Optimal'
        END as status_category
      FROM equipment e
      JOIN utilization_logs u ON e.id = u.equipment_id
      GROUP BY e.id, e.name, e.equipment_code, e.category, e.department
      ORDER BY avg_utilization_rate DESC
    `);

    return res.json({
      success: true,
      report: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportReportCsv(req: Request, res: Response) {
  const { type = 'equipment' } = req.query;

  try {
    let rows: any[] = [];
    let filename = `EquipSure_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'equipment') {
      const result = await pool.query('SELECT equipment_code, name, category, manufacturer, model, serial_number, department, location_room, purchase_date, purchase_cost, warranty_expiry, status, criticality FROM equipment ORDER BY id ASC');
      rows = result.rows;
    } else if (type === 'maintenance') {
      const result = await pool.query(`
        SELECT e.equipment_code, e.name as equipment_name, e.department, ms.title, ms.frequency, ms.last_maintenance_date, ms.next_maintenance_date, ms.status, ms.notes
        FROM maintenance_schedules ms
        JOIN equipment e ON ms.equipment_id = e.id
        ORDER BY ms.next_maintenance_date ASC
      `);
      rows = result.rows;
    } else if (type === 'calibrations') {
      const result = await pool.query(`
        SELECT e.equipment_code, e.name as equipment_name, e.department, c.certificate_number, c.calibration_date, c.next_due_date, c.status, c.standard_used, c.accuracy_drift, c.calibrated_by
        FROM calibrations c
        JOIN equipment e ON c.equipment_id = e.id
        ORDER BY c.next_due_date ASC
      `);
      rows = result.rows;
    } else if (type === 'warranties') {
      const result = await pool.query(`
        SELECT e.equipment_code, e.name as equipment_name, e.department, w.provider_name, w.contract_type, w.start_date, w.end_date, w.annual_cost, w.status, w.contact_person, w.contact_phone
        FROM warranties w
        JOIN equipment e ON w.equipment_id = e.id
        ORDER BY w.end_date ASC
      `);
      rows = result.rows;
    } else if (type === 'service_requests') {
      const result = await pool.query(`
        SELECT sr.ticket_number, e.equipment_code, e.name as equipment_name, e.department, sr.priority, sr.status, sr.issue_description, sr.repair_cost, sr.downtime_hours, sr.reported_at, sr.resolved_at
        FROM service_requests sr
        JOIN equipment e ON sr.equipment_id = e.id
        ORDER BY sr.reported_at DESC
      `);
      rows = result.rows;
    }

    if (rows.length === 0) {
      return res.status(404).send('No data found for the specified export.');
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',')
      )
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
