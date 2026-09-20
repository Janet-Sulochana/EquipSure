import { Request, Response } from 'express';
import pool from '../config/db.js';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Run parallel aggregation queries
    const [
      totalEquipmentResult,
      statusCountsResult,
      maintenanceDueResult,
      calibrationDueResult,
      warrantyExpiringResult,
      openTicketsResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as total, COALESCE(SUM(purchase_cost), 0)::numeric as total_value FROM equipment'),
      pool.query(`
        SELECT status, COUNT(*)::int as count 
        FROM equipment 
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*)::int as due_count
        FROM maintenance_schedules
        WHERE status IN ('scheduled', 'in_progress', 'overdue')
          AND next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int as due_count
        FROM calibrations
        WHERE status IN ('due_soon', 'overdue')
           OR next_due_date <= CURRENT_DATE + INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int as expiring_count
        FROM warranties
        WHERE end_date <= CURRENT_DATE + INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int as open_count
        FROM service_requests
        WHERE status IN ('reported', 'assigned', 'in_progress')
      `),
    ]);

    const statusMap: Record<string, number> = {
      operational: 0,
      under_maintenance: 0,
      under_repair: 0,
      needs_calibration: 0,
      decommissioned: 0,
    };

    statusCountsResult.rows.forEach((r) => {
      statusMap[r.status] = r.count;
    });

    const stats = {
      totalEquipment: totalEquipmentResult.rows[0].total,
      totalAssetValue: parseFloat(totalEquipmentResult.rows[0].total_value),
      operational: statusMap.operational,
      underMaintenance: statusMap.under_maintenance,
      underRepair: statusMap.under_repair,
      needsCalibration: statusMap.needs_calibration,
      decommissioned: statusMap.decommissioned,
      maintenanceDue: maintenanceDueResult.rows[0].due_count,
      calibrationDue: calibrationDueResult.rows[0].due_count,
      warrantyExpiring: warrantyExpiringResult.rows[0].expiring_count,
      openTickets: openTicketsResult.rows[0].open_count,
      operationalRate: totalEquipmentResult.rows[0].total > 0
        ? Math.round((statusMap.operational / totalEquipmentResult.rows[0].total) * 100)
        : 0,
    };

    return res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[Dashboard] Error fetching stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDepartmentDistribution(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        department,
        COUNT(*)::int as total_devices,
        COUNT(CASE WHEN status = 'operational' THEN 1 END)::int as operational,
        COUNT(CASE WHEN status != 'operational' THEN 1 END)::int as attention_needed,
        ROUND(AVG(purchase_cost), 2)::numeric as avg_asset_cost
      FROM equipment
      GROUP BY department
      ORDER BY total_devices DESC
    `);

    return res.json({
      success: true,
      departments: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRecentActivity(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        'service_request' as activity_type,
        sr.id,
        sr.ticket_number as reference_code,
        sr.priority,
        sr.status,
        sr.issue_description as title,
        e.name as equipment_name,
        e.equipment_code,
        sr.reported_at as timestamp,
        u.name as user_name
      FROM service_requests sr
      JOIN equipment e ON sr.equipment_id = e.id
      JOIN users u ON sr.reported_by = u.id

      UNION ALL

      SELECT 
        'preventive_maintenance' as activity_type,
        ms.id,
        ms.title as reference_code,
        ms.frequency as priority,
        ms.status,
        ms.title as title,
        e.name as equipment_name,
        e.equipment_code,
        ms.updated_at as timestamp,
        COALESCE(u.name, 'Biomedical Team') as user_name
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.performed_by = u.id

      UNION ALL

      SELECT 
        'calibration' as activity_type,
        c.id,
        c.certificate_number as reference_code,
        c.status as priority,
        c.status,
        c.standard_used as title,
        e.name as equipment_name,
        e.equipment_code,
        c.created_at as timestamp,
        c.calibrated_by as user_name
      FROM calibrations c
      JOIN equipment e ON c.equipment_id = e.id

      ORDER BY timestamp DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      activities: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPriorityAttention(req: Request, res: Response) {
  try {
    const [maintenance, calibrations, warranties, tickets] = await Promise.all([
      pool.query(`
        SELECT ms.id, ms.title, ms.next_maintenance_date, ms.status, e.id as equipment_id, e.name as equipment_name, e.equipment_code, e.department
        FROM maintenance_schedules ms
        JOIN equipment e ON ms.equipment_id = e.id
        WHERE ms.status IN ('scheduled', 'in_progress', 'overdue')
          AND ms.next_maintenance_date <= CURRENT_DATE + INTERVAL '14 days'
        ORDER BY ms.next_maintenance_date ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT c.id, c.certificate_number, c.next_due_date, c.status, e.id as equipment_id, e.name as equipment_name, e.equipment_code, e.department
        FROM calibrations c
        JOIN equipment e ON c.equipment_id = e.id
        WHERE c.status IN ('due_soon', 'overdue')
           OR c.next_due_date <= CURRENT_DATE + INTERVAL '14 days'
        ORDER BY c.next_due_date ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT w.id, w.provider_name, w.contract_type, w.end_date, w.status, e.id as equipment_id, e.name as equipment_name, e.equipment_code
        FROM warranties w
        JOIN equipment e ON w.equipment_id = e.id
        WHERE w.end_date <= CURRENT_DATE + INTERVAL '30 days'
        ORDER BY w.end_date ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT sr.id, sr.ticket_number, sr.priority, sr.status, sr.issue_description, sr.reported_at, e.name as equipment_name, e.equipment_code, e.location_room
        FROM service_requests sr
        JOIN equipment e ON sr.equipment_id = e.id
        WHERE sr.status IN ('reported', 'assigned', 'in_progress')
        ORDER BY CASE sr.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, sr.reported_at ASC
        LIMIT 5
      `),
    ]);

    return res.json({
      success: true,
      attention: {
        maintenance: maintenance.rows,
        calibrations: calibrations.rows,
        warranties: warranties.rows,
        tickets: tickets.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
