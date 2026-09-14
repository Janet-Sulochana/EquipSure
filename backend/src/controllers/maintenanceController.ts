import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getMaintenanceList(req: Request, res: Response) {
  try {
    const { status, equipment_id, department, timeframe } = req.query;

    let query = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.equipment_code,
        e.department,
        e.location_room,
        e.model,
        e.manufacturer,
        u.name as performed_by_name
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.performed_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (status) {
      query += ` AND ms.status = $${pIndex}`;
      params.push(status);
      pIndex++;
    }

    if (equipment_id) {
      query += ` AND ms.equipment_id = $${pIndex}`;
      params.push(equipment_id);
      pIndex++;
    }

    if (department) {
      query += ` AND e.department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    if (timeframe === 'upcoming_30') {
      query += ` AND ms.next_maintenance_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
    } else if (timeframe === 'overdue') {
      query += ` AND ms.next_maintenance_date < CURRENT_DATE AND ms.status != 'completed'`;
    }

    query += ` ORDER BY ms.next_maintenance_date ASC`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createMaintenance(req: AuthenticatedRequest, res: Response) {
  const {
    equipment_id,
    title,
    frequency,
    next_maintenance_date,
    checklist = [],
    performed_by,
    notes,
  } = req.body;

  if (!equipment_id || !title || !frequency || !next_maintenance_date) {
    return res.status(400).json({
      success: false,
      message: 'Equipment ID, title, frequency, and next maintenance date are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO maintenance_schedules (
        equipment_id, title, frequency, next_maintenance_date, checklist, performed_by, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *`,
      [
        equipment_id,
        title,
        frequency,
        next_maintenance_date,
        JSON.stringify(checklist),
        performed_by || (req.user ? req.user.id : null),
        notes || null,
      ]
    );

    // Invalidate Redis dashboard cache
    await redisService.del('dashboard:kpi_stats');

    return res.status(201).json({
      success: true,
      message: 'Preventive maintenance schedule created',
      schedule: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function completeMaintenance(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { checklist, notes, next_date } = req.body;

  try {
    const scheduleResult = await pool.query('SELECT * FROM maintenance_schedules WHERE id = $1', [id]);
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });
    }

    const current = scheduleResult.rows[0];

    // Compute next maintenance date according to frequency if not explicitly provided
    let calculatedNextDate = next_date;
    if (!calculatedNextDate) {
      const today = new Date();
      if (current.frequency === 'monthly') today.setMonth(today.getMonth() + 1);
      else if (current.frequency === 'quarterly') today.setMonth(today.getMonth() + 3);
      else if (current.frequency === 'semi_annual') today.setMonth(today.getMonth() + 6);
      else if (current.frequency === 'annual') today.setFullYear(today.getFullYear() + 1);
      calculatedNextDate = today.toISOString().split('T')[0];
    }

    const performerId = req.user ? req.user.id : current.performed_by;

    const result = await pool.query(
      `UPDATE maintenance_schedules SET
        status = 'completed',
        last_maintenance_date = CURRENT_DATE,
        next_maintenance_date = $1,
        checklist = COALESCE($2, checklist),
        performed_by = COALESCE($3, performed_by),
        notes = COALESCE($4, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [calculatedNextDate, checklist ? JSON.stringify(checklist) : null, performerId, notes, id]
    );

    // Also update equipment status back to operational if it was under maintenance
    await pool.query(
      `UPDATE equipment SET status = 'operational', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'under_maintenance'`,
      [current.equipment_id]
    );

    // Invalidate Redis dashboard cache
    await redisService.del('dashboard:kpi_stats');

    // Publish notification event
    await redisService.publishNotification('maintenance:completed', {
      scheduleId: id,
      equipmentId: current.equipment_id,
      completedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Maintenance successfully marked as completed',
      schedule: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMaintenance(req: Request, res: Response) {
  const { id } = req.params;
  const { title, frequency, next_maintenance_date, status, checklist, performed_by, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE maintenance_schedules SET
        title = COALESCE($1, title),
        frequency = COALESCE($2, frequency),
        next_maintenance_date = COALESCE($3, next_maintenance_date),
        status = COALESCE($4, status),
        checklist = CASE WHEN $5::text IS NOT NULL THEN $5::jsonb ELSE checklist END,
        performed_by = COALESCE($6, performed_by),
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        title,
        frequency,
        next_maintenance_date,
        status,
        checklist ? JSON.stringify(checklist) : null,
        performed_by,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await redisService.del('dashboard:kpi_stats');

    return res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
