import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';

export async function getDepartments(req: Request, res: Response) {
  const cacheKey = 'departments:all';

  try {
    const cached = await redisService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json({ success: true, data: cached, cached: true });
    }

    const result = await pool.query(`
      SELECT 
        d.*,
        COUNT(e.id)::int as total_equipment,
        COUNT(CASE WHEN e.status = 'operational' THEN 1 END)::int as operational_equipment
      FROM departments d
      LEFT JOIN equipment e ON LOWER(e.department) = LOWER(d.name) OR LOWER(e.department) = LOWER(d.code)
      GROUP BY d.id
      ORDER BY d.id ASC
    `);

    await redisService.set(cacheKey, result.rows, 300);

    res.setHeader('X-Cache', 'MISS');
    return res.json({
      success: true,
      data: result.rows,
      cached: false,
    });
  } catch (error: any) {
    console.error('[Departments] Error fetching:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDepartment(req: Request, res: Response) {
  const { name, code, floor_building, head_of_department, contact_phone } = req.body;

  if (!name || !code || !floor_building) {
    return res.status(400).json({
      success: false,
      message: 'Department Name, Code, and Location/Floor are required.',
    });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($2)',
      [name.trim(), code.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A department with this Name or Code already exists.',
      });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, code, floor_building, head_of_department, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), code.trim().toUpperCase(), floor_building.trim(), head_of_department || null, contact_phone || null]
    );

    await redisService.del('departments:all');

    return res.status(201).json({
      success: true,
      message: 'Department registered successfully',
      department: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
