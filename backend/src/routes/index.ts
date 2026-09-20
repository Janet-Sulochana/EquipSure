import { Router, Request, Response } from 'express';
import { login, register, getMe, getUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { getDashboardStats, getDepartmentDistribution, getRecentActivity, getPriorityAttention } from '../controllers/dashboardController.js';
import { getEquipmentList, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = Router();

// System Health
router.get('/system/status', async (req: Request, res: Response) => {
  let pgStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch (err: any) {
    pgStatus = `error: ${err.message}`;
  }

  return res.json({
    app: 'EquipSure Biomedical Equipment Management System',
    status: 'operational',
    timestamp: new Date().toISOString(),
    database: {
      type: 'PostgreSQL',
      status: pgStatus,
    },
  });
});

// Authentication
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticateToken, getMe);

// Hospital Departments
router.get('/departments', getDepartments);
router.post('/departments', authenticateToken, requireRole(['admin']), createDepartment);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/departments', getDepartmentDistribution);
router.get('/dashboard/recent-activity', getRecentActivity);
router.get('/dashboard/attention', getPriorityAttention);

// Equipment Inventory
router.get('/equipment', getEquipmentList);
router.get('/equipment/:id', getEquipmentById);
router.post('/equipment', authenticateToken, requireRole(['admin', 'biomedical_engineer']), createEquipment);
router.put('/equipment/:id', authenticateToken, requireRole(['admin', 'biomedical_engineer']), updateEquipment);
router.delete('/equipment/:id', authenticateToken, requireRole(['admin']), deleteEquipment);

export default router;
