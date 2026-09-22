import { Request, Response } from 'express';
import pool from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getUtilizationLogs(req: Request, res: Response) {
  try {
    const { equipment_id, department, stress_level, start_date, end_date } = req.query;

    let query = `
      SELECT 
        u.*,
        e.name as equipment_name,
        e.equipment_code,
        e.department,
        e.location_room,
        e.category,
        usr.name as logged_by_name
      FROM utilization_logs u
      JOIN equipment e ON u.equipment_id = e.id
      LEFT JOIN users usr ON u.logged_by = usr.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (equipment_id) {
      query += ` AND u.equipment_id = $${pIndex}`;
      params.push(equipment_id);
      pIndex++;
    }

    if (department) {
      query += ` AND e.department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    if (stress_level) {
      query += ` AND u.stress_level = $${pIndex}`;
      params.push(stress_level);
      pIndex++;
    }

    if (start_date) {
      query += ` AND u.log_date >= $${pIndex}`;
      params.push(start_date);
      pIndex++;
    }

    if (end_date) {
      query += ` AND u.log_date <= $${pIndex}`;
      params.push(end_date);
      pIndex++;
    }

    query += ` ORDER BY u.log_date DESC, u.id DESC LIMIT 100`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUtilizationAnalytics(req: Request, res: Response) {
  try {
    // Calculate average utilization across all active equipment
    const overviewResult = await pool.query(`
      SELECT 
        ROUND(AVG(utilization_rate), 2) as avg_hospital_utilization,
        SUM(operating_hours) as total_operating_hours,
        SUM(idle_hours) as total_idle_hours,
        SUM(patients_served) as total_patients_served,
        COUNT(DISTINCT equipment_id) as active_tracked_devices
      FROM utilization_logs
      WHERE log_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Identify underutilized equipment (< 20% utilization)
    const underutilizedResult = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.equipment_code,
        e.department,
        ROUND(AVG(u.utilization_rate), 1) as avg_utilization,
        ROUND(AVG(u.operating_hours), 1) as avg_daily_hours,
        ROUND(AVG(u.idle_hours), 1) as avg_idle_hours,
        'underutilized' as classification
      FROM equipment e
      JOIN utilization_logs u ON e.id = u.equipment_id
      GROUP BY e.id, e.name, e.equipment_code, e.department
      HAVING AVG(u.utilization_rate) < 20.0
      ORDER BY avg_utilization ASC
    `);

    // Identify high-stress / overused equipment (> 80% utilization)
    const overusedResult = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.equipment_code,
        e.department,
        ROUND(AVG(u.utilization_rate), 1) as avg_utilization,
        ROUND(AVG(u.operating_hours), 1) as avg_daily_hours,
        SUM(u.patients_served) as total_patients_served,
        'overused' as classification
      FROM equipment e
      JOIN utilization_logs u ON e.id = u.equipment_id
      GROUP BY e.id, e.name, e.equipment_code, e.department
      HAVING AVG(u.utilization_rate) > 80.0
      ORDER BY avg_utilization DESC
    `);

    // Department utilization averages
    const deptResult = await pool.query(`
      SELECT 
        e.department,
        ROUND(AVG(u.utilization_rate), 1) as avg_utilization,
        SUM(u.patients_served)::int as patients_served,
        COUNT(DISTINCT e.id)::int as devices_tracked
      FROM equipment e
      JOIN utilization_logs u ON e.id = u.equipment_id
      GROUP BY e.department
      ORDER BY avg_utilization DESC
    `);

    return res.json({
      success: true,
      analytics: {
        overview: overviewResult.rows[0],
        underutilized: underutilizedResult.rows,
        overused: overusedResult.rows,
        departmentUtilization: deptResult.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function logUtilization(req: AuthenticatedRequest, res: Response) {
  const {
    equipment_id,
    log_date = new Date().toISOString().split('T')[0],
    operating_hours,
    idle_hours,
    patients_served = 0,
  } = req.body;

  if (!equipment_id || operating_hours === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Equipment ID and Operating Hours are required.',
    });
  }

  const opHours = parseFloat(operating_hours);
  const idle = idle_hours !== undefined ? parseFloat(idle_hours) : Math.max(0, 24 - opHours);
  const totalHours = Math.max(opHours + idle, 24);
  const rate = Math.min(100, Math.round((opHours / totalHours) * 10000) / 100);

  let stress_level = 'optimal';
  if (rate < 20) stress_level = 'underutilized';
  else if (rate > 80) stress_level = 'overused';

  const logged_by = req.user ? req.user.id : null;

  try {
    const result = await pool.query(
      `INSERT INTO utilization_logs (
        equipment_id, log_date, operating_hours, idle_hours, patients_served, utilization_rate, stress_level, logged_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [equipment_id, log_date, opHours, idle, patients_served, rate, stress_level, logged_by]
    );

    return res.status(201).json({
      success: true,
      message: 'Utilization logged successfully',
      log: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
