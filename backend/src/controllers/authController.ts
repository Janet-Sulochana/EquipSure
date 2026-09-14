import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'equipsure_super_secret_jwt_key_2026_healthcare_security';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Clinical email and password are required.',
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
        message: 'Invalid credentials. Please verify your hospital email and password.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your hospital email and password.',
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
      message: 'Authentication successful',
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
  const { name, email, password, role = 'hospital_staff', department, phone } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({
      success: false,
      message: 'Full Name, Email, Password, and Department are required.',
    });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid institutional email address.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Hospital security policy requires a password of at least 8 characters.',
    });
  }

  const validRoles = ['admin', 'biomedical_engineer', 'hospital_staff'];
  const userRole = validRoles.includes(role) ? role : 'hospital_staff';

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A hospital account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department, phone, created_at`,
      [name.trim(), email.trim().toLowerCase(), password_hash, userRole, department.trim(), phone ? phone.trim() : null]
    );

    const newUser = result.rows[0];

    // Generate token so new registrant can immediately proceed
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(201).json({
      success: true,
      message: 'Staff account registered successfully',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during account creation.',
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
    const { role, department, search } = req.query;
    let query = 'SELECT id, name, email, role, department, phone, created_at FROM users WHERE 1=1';
    const params: any[] = [];
    let pIndex = 1;

    if (role) {
      query += ` AND role = $${pIndex}`;
      params.push(role);
      pIndex++;
    }

    if (department) {
      query += ` AND department = $${pIndex}`;
      params.push(department);
      pIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${pIndex} OR email ILIKE $${pIndex} OR department ILIKE $${pIndex})`;
      params.push(`%${search}%`);
      pIndex++;
    }

    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      users: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, role, department, phone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        department = COALESCE($3, department),
        phone = COALESCE($4, phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, role, department, phone, updated_at`,
      [name, role, department, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'User profile updated successfully',
      user: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  if (req.user && String(req.user.id) === String(id)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own administrative account.',
    });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: `Staff member "${result.rows[0].name}" removed from registry.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
