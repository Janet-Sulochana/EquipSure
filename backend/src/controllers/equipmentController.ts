import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';

export async function getEquipmentList(req: Request, res: Response) {
  try {
    const { search, category, department, status, criticality, sort = 'id', order = 'DESC', limit = 50, page = 1 } = req.query;

    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params: any[] = [];
    let pIndex = 1;

    if (search) {
      query += ` AND (
        name ILIKE $${pIndex} OR 
        equipment_code ILIKE $${pIndex} OR 
        serial_number ILIKE $${pIndex} OR 
        manufacturer ILIKE $${pIndex} OR 
        model ILIKE $${pIndex}
      )`;
      params.push(`%${search}%`);
      pIndex++;
    }

    if (category) {
      query += ` AND category = $${pIndex}`;
      params.push(category);
      pIndex++;
    }

    if (department) {
      query += ` AND department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    if (status) {
      query += ` AND status = $${pIndex}`;
      params.push(status);
      pIndex++;
    }

    if (criticality) {
      query += ` AND criticality = $${pIndex}`;
      params.push(criticality);
      pIndex++;
    }

    // Count total before pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)::int as total');
    const countResult = await pool.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Sorting & pagination
    const allowedSortColumns = ['id', 'equipment_code', 'name', 'category', 'department', 'purchase_date', 'warranty_expiry', 'status', 'criticality'];
    const sortCol = allowedSortColumns.includes(sort as string) ? sort : 'id';
    const sortDir = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const numLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);
    const numPage = Math.max(parseInt(page as string, 10) || 1, 1);
    const offset = (numPage - 1) * numLimit;

    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
    params.push(numLimit, offset);

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: numPage,
        limit: numLimit,
        totalPages: Math.ceil(total / numLimit),
      },
    });
  } catch (error: any) {
    console.error('[Equipment] Get list error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEquipmentById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [id]);

    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const equipment = equipmentResult.rows[0];

    // Fetch related records in parallel for full 360° lifecycle view
    const [maintenanceResult, calibrationResult, warrantyResult, serviceResult, utilizationResult] = await Promise.all([
      pool.query(`
        SELECT ms.*, u.name as technician_name 
        FROM maintenance_schedules ms 
        LEFT JOIN users u ON ms.performed_by = u.id 
        WHERE ms.equipment_id = $1 
        ORDER BY ms.next_maintenance_date DESC
      `, [id]),
      pool.query(`
        SELECT * FROM calibrations 
        WHERE equipment_id = $1 
        ORDER BY calibration_date DESC
      `, [id]),
      pool.query(`
        SELECT * FROM warranties 
        WHERE equipment_id = $1 
        ORDER BY end_date DESC
      `, [id]),
      pool.query(`
        SELECT sr.*, u.name as reporter_name, a.name as technician_name 
        FROM service_requests sr 
        LEFT JOIN users u ON sr.reported_by = u.id 
        LEFT JOIN users a ON sr.assigned_to = a.id 
        WHERE sr.equipment_id = $1 
        ORDER BY sr.reported_at DESC
      `, [id]),
      pool.query(`
        SELECT * FROM utilization_logs 
        WHERE equipment_id = $1 
        ORDER BY log_date DESC 
        LIMIT 14
      `, [id]),
    ]);

    return res.json({
      success: true,
      equipment: {
        ...equipment,
        maintenance_schedules: maintenanceResult.rows,
        calibrations: calibrationResult.rows,
        warranties: warrantyResult.rows,
        service_requests: serviceResult.rows,
        utilization_logs: utilizationResult.rows,
      },
    });
  } catch (error: any) {
    console.error('[Equipment] Get by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createEquipment(req: Request, res: Response) {
  const {
    equipment_code,
    name,
    category,
    manufacturer,
    model,
    serial_number,
    department,
    location_room,
    purchase_date,
    purchase_cost,
    warranty_expiry,
    status = 'operational',
    criticality = 'medium',
    notes,
  } = req.body;

  if (!equipment_code || !name || !category || !manufacturer || !model || !serial_number || !department || !location_room || !purchase_date || !warranty_expiry) {
    return res.status(400).json({
      success: false,
      message: 'Missing required equipment fields (Code, Name, Category, Manufacturer, Model, Serial No, Department, Location, Purchase Date, Warranty Expiry).',
    });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM equipment WHERE equipment_code = $1 OR serial_number = $2',
      [equipment_code.trim(), serial_number.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An equipment item with this Equipment Code or Serial Number already exists.',
      });
    }

    const result = await pool.query(
      `INSERT INTO equipment (
        equipment_code, name, category, manufacturer, model, serial_number, 
        department, location_room, purchase_date, purchase_cost, warranty_expiry, 
        status, criticality, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        equipment_code.trim().toUpperCase(),
        name.trim(),
        category.trim(),
        manufacturer.trim(),
        model.trim(),
        serial_number.trim(),
        department.trim(),
        location_room.trim(),
        purchase_date,
        purchase_cost || 0,
        warranty_expiry,
        status,
        criticality,
        notes || null,
      ]
    );

    // Invalidate Redis dashboard cache
    await redisService.del('dashboard:kpi_stats');

    return res.status(201).json({
      success: true,
      message: 'Equipment registered successfully',
      equipment: result.rows[0],
    });
  } catch (error: any) {
    console.error('[Equipment] Create error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEquipment(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    category,
    manufacturer,
    model,
    department,
    location_room,
    purchase_date,
    purchase_cost,
    warranty_expiry,
    status,
    criticality,
    notes,
  } = req.body;

  try {
    const check = await pool.query('SELECT id FROM equipment WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const result = await pool.query(
      `UPDATE equipment SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        manufacturer = COALESCE($3, manufacturer),
        model = COALESCE($4, model),
        department = COALESCE($5, department),
        location_room = COALESCE($6, location_room),
        purchase_date = COALESCE($7, purchase_date),
        purchase_cost = COALESCE($8, purchase_cost),
        warranty_expiry = COALESCE($9, warranty_expiry),
        status = COALESCE($10, status),
        criticality = COALESCE($11, criticality),
        notes = COALESCE($12, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        name,
        category,
        manufacturer,
        model,
        department,
        location_room,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        status,
        criticality,
        notes,
        id,
      ]
    );

    // Invalidate Redis dashboard cache
    await redisService.del('dashboard:kpi_stats');

    return res.json({
      success: true,
      message: 'Equipment updated successfully',
      equipment: result.rows[0],
    });
  } catch (error: any) {
    console.error('[Equipment] Update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteEquipment(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    // Invalidate Redis dashboard cache
    await redisService.del('dashboard:kpi_stats');

    return res.json({
      success: true,
      message: `Equipment "${result.rows[0].name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('[Equipment] Delete error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
