import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';

export async function getCalibrations(req: Request, res: Response) {
  try {
    const { status, equipment_id, department } = req.query;

    let query = `
      SELECT 
        c.*,
        e.name as equipment_name,
        e.equipment_code,
        e.department,
        e.location_room,
        e.model,
        e.manufacturer
      FROM calibrations c
      JOIN equipment e ON c.equipment_id = e.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (status) {
      query += ` AND c.status = $${pIndex}`;
      params.push(status);
      pIndex++;
    }

    if (equipment_id) {
      query += ` AND c.equipment_id = $${pIndex}`;
      params.push(equipment_id);
      pIndex++;
    }

    if (department) {
      query += ` AND e.department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    query += ` ORDER BY c.next_due_date ASC`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCalibration(req: Request, res: Response) {
  const {
    equipment_id,
    certificate_number,
    calibration_date,
    next_due_date,
    status = 'passed',
    standard_used,
    accuracy_drift,
    calibrated_by,
    remarks,
  } = req.body;

  if (!equipment_id || !certificate_number || !calibration_date || !next_due_date || !standard_used || !calibrated_by) {
    return res.status(400).json({
      success: false,
      message: 'Equipment ID, Certificate Number, Calibration Date, Next Due Date, Standard, and Calibrated By are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO calibrations (
        equipment_id, certificate_number, calibration_date, next_due_date, status, standard_used, accuracy_drift, calibrated_by, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        equipment_id,
        certificate_number.trim(),
        calibration_date,
        next_due_date,
        status,
        standard_used.trim(),
        accuracy_drift || null,
        calibrated_by.trim(),
        remarks || null,
      ]
    );

    // Update equipment status based on calibration result
    if (status === 'passed') {
      await pool.query(
        `UPDATE equipment SET status = 'operational', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status = 'needs_calibration'`,
        [equipment_id]
      );
    } else if (status === 'failed') {
      await pool.query(
        `UPDATE equipment SET status = 'needs_calibration', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [equipment_id]
      );

      // Create notification alert for failed calibration
      await pool.query(
        `INSERT INTO notifications (type, title, message, link)
         VALUES ('calibration_due', 'Calibration Failed: Alert', $1, '/calibrations')`,
        [`Equipment #${equipment_id} failed calibration standard: ${standard_used}. Device marked as Needs Calibration.`]
      );
    }

    await redisService.del('dashboard:kpi_stats');

    return res.status(201).json({
      success: true,
      message: 'Calibration recorded successfully',
      calibration: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
