import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';

export async function getWarranties(req: Request, res: Response) {
  try {
    const { status, contract_type, expiring_in_days } = req.query;

    let query = `
      SELECT 
        w.*,
        e.name as equipment_name,
        e.equipment_code,
        e.department,
        e.location_room,
        e.manufacturer,
        e.model,
        CURRENT_DATE as current_check_date,
        (w.end_date - CURRENT_DATE) as days_remaining
      FROM warranties w
      JOIN equipment e ON w.equipment_id = e.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (status) {
      query += ` AND w.status = $${pIndex}`;
      params.push(status);
      pIndex++;
    }

    if (contract_type) {
      query += ` AND w.contract_type = $${pIndex}`;
      params.push(contract_type);
      pIndex++;
    }

    if (expiring_in_days) {
      query += ` AND w.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${pIndex} || ' days')::interval`;
      params.push(expiring_in_days);
      pIndex++;
    }

    query += ` ORDER BY w.end_date ASC`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createWarranty(req: Request, res: Response) {
  const {
    equipment_id,
    provider_name,
    contract_type,
    start_date,
    end_date,
    contact_person,
    contact_phone,
    contact_email,
    coverage_terms,
    annual_cost = 0,
    status = 'active',
  } = req.body;

  if (!equipment_id || !provider_name || !contract_type || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Equipment ID, Provider Name, Contract Type, Start Date, and End Date are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO warranties (
        equipment_id, provider_name, contract_type, start_date, end_date,
        contact_person, contact_phone, contact_email, coverage_terms, annual_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        equipment_id,
        provider_name.trim(),
        contract_type,
        start_date,
        end_date,
        contact_person || null,
        contact_phone || null,
        contact_email || null,
        coverage_terms || null,
        annual_cost,
        status,
      ]
    );

    // Also update equipment warranty_expiry field to reflect latest date
    await pool.query(
      `UPDATE equipment SET warranty_expiry = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [end_date, equipment_id]
    );

    await redisService.del('dashboard:kpi_stats');

    return res.status(201).json({
      success: true,
      message: 'Warranty contract registered successfully',
      warranty: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateWarranty(req: Request, res: Response) {
  const { id } = req.params;
  const {
    provider_name,
    contract_type,
    start_date,
    end_date,
    contact_person,
    contact_phone,
    contact_email,
    coverage_terms,
    annual_cost,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE warranties SET
        provider_name = COALESCE($1, provider_name),
        contract_type = COALESCE($2, contract_type),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        contact_person = COALESCE($5, contact_person),
        contact_phone = COALESCE($6, contact_phone),
        contact_email = COALESCE($7, contact_email),
        coverage_terms = COALESCE($8, coverage_terms),
        annual_cost = COALESCE($9, annual_cost),
        status = COALESCE($10, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        provider_name,
        contract_type,
        start_date,
        end_date,
        contact_person,
        contact_phone,
        contact_email,
        coverage_terms,
        annual_cost,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warranty contract not found' });
    }

    await redisService.del('dashboard:kpi_stats');

    return res.json({
      success: true,
      message: 'Warranty updated successfully',
      warranty: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
