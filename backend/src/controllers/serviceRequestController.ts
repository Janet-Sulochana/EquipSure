import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getServiceRequests(req: Request, res: Response) {
  try {
    const { status, priority, equipment_id, department } = req.query;

    let query = `
      SELECT 
        sr.*,
        e.name as equipment_name,
        e.equipment_code,
        e.department,
        e.location_room,
        e.manufacturer,
        e.model,
        u.name as reporter_name,
        u.role as reporter_role,
        a.name as technician_name
      FROM service_requests sr
      JOIN equipment e ON sr.equipment_id = e.id
      JOIN users u ON sr.reported_by = u.id
      LEFT JOIN users a ON sr.assigned_to = a.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (status) {
      query += ` AND sr.status = $${pIndex}`;
      params.push(status);
      pIndex++;
    }

    if (priority) {
      query += ` AND sr.priority = $${pIndex}`;
      params.push(priority);
      pIndex++;
    }

    if (equipment_id) {
      query += ` AND sr.equipment_id = $${pIndex}`;
      params.push(equipment_id);
      pIndex++;
    }

    if (department) {
      query += ` AND e.department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    query += ` ORDER BY sr.reported_at DESC`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createServiceRequest(req: AuthenticatedRequest, res: Response) {
  const {
    equipment_id,
    priority = 'medium',
    issue_description,
    assigned_to,
  } = req.body;

  if (!equipment_id || !issue_description) {
    return res.status(400).json({
      success: false,
      message: 'Equipment ID and Issue Description are required.',
    });
  }

  const reported_by = req.user ? req.user.id : (req.body.reported_by || 1);

  try {
    // Generate unique sequential ticket number
    const countResult = await pool.query('SELECT COUNT(*)::int as count FROM service_requests');
    const ticketSeq = (countResult.rows[0].count + 1).toString().padStart(4, '0');
    const ticket_number = `SR-2026-${ticketSeq}`;

    const initialStatus = assigned_to ? 'assigned' : 'reported';

    const result = await pool.query(
      `INSERT INTO service_requests (
        ticket_number, equipment_id, reported_by, priority, issue_description, assigned_to, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [ticket_number, equipment_id, reported_by, priority, issue_description.trim(), assigned_to || null, initialStatus]
    );

    // Automatically update equipment status to 'under_repair' if priority is high/critical
    if (priority === 'critical' || priority === 'high') {
      await pool.query(
        `UPDATE equipment SET status = 'under_repair', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [equipment_id]
      );
    }

    // Insert alert notification for BME team
    const equipmentInfo = await pool.query('SELECT name, equipment_code, location_room FROM equipment WHERE id = $1', [equipment_id]);
    const eq = equipmentInfo.rows[0];

    await pool.query(
      `INSERT INTO notifications (type, title, message, link)
       VALUES ('service_request', $1, $2, '/service-requests')`,
      [
        `New ${priority.toUpperCase()} Breakdown Ticket: ${ticket_number}`,
        `${eq ? eq.name : 'Equipment'} in ${eq ? eq.location_room : 'Department'} reported: "${issue_description.substring(0, 100)}..."`,
      ]
    );

    // Publish Redis event
    await redisService.publishNotification('service:new_ticket', {
      ticketNumber: ticket_number,
      equipmentId: equipment_id,
      priority,
    });

    await redisService.del('dashboard:kpi_stats');

    return res.status(201).json({
      success: true,
      message: `Breakdown ticket ${ticket_number} logged successfully`,
      ticket: result.rows[0],
    });
  } catch (error: any) {
    console.error('[ServiceRequest] Create error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateServiceRequest(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const {
    priority,
    status,
    assigned_to,
    resolution_details,
    spare_parts_used,
    repair_cost,
    downtime_hours,
  } = req.body;

  try {
    const currentResult = await pool.query('SELECT * FROM service_requests WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const current = currentResult.rows[0];
    const isResolving = status === 'resolved' || status === 'closed';
    const resolvedAt = isResolving && !current.resolved_at ? new Date() : current.resolved_at;

    const result = await pool.query(
      `UPDATE service_requests SET
        priority = COALESCE($1, priority),
        status = COALESCE($2, status),
        assigned_to = COALESCE($3, assigned_to),
        resolution_details = COALESCE($4, resolution_details),
        spare_parts_used = COALESCE($5, spare_parts_used),
        repair_cost = COALESCE($6, repair_cost),
        downtime_hours = COALESCE($7, downtime_hours),
        resolved_at = $8
      WHERE id = $9
      RETURNING *`,
      [
        priority,
        status,
        assigned_to,
        resolution_details,
        spare_parts_used,
        repair_cost,
        downtime_hours,
        resolvedAt,
        id,
      ]
    );

    // If resolved or closed, restore equipment to operational
    if (isResolving) {
      await pool.query(
        `UPDATE equipment SET status = 'operational', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status = 'under_repair'`,
        [current.equipment_id]
      );
    }

    await redisService.del('dashboard:kpi_stats');

    return res.json({
      success: true,
      message: 'Service request updated successfully',
      ticket: result.rows[0],
    });
  } catch (error: any) {
    console.error('[ServiceRequest] Update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
