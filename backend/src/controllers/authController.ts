import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'equipsure_super_secret_jwt_key_2026_healthcare_security';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, department, phone FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

export async function register(req: Request, res: Response) {
  const { name, email, password, role, department, phone } = req.body;

  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password, role, and department are required.',
    });
  }

  const validRoles = ['admin', 'biomedical_engineer', 'hospital_staff'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${validRoles.join(', ')}`,
    });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department, phone, created_at`,
      [name, email.trim().toLowerCase(), password_hash, role, department, phone || null]
    );

    const newUser = result.rows[0];
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
    });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, department, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, email, role, department, phone FROM users';
    const params: any[] = [];

    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      users: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
