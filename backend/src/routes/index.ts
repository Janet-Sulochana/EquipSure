import { Router, Request, Response } from 'express';
import { login, register, getMe, getUsers } from '../controllers/authController.js';
import { getDashboardStats, getDepartmentDistribution, getRecentActivity, getPriorityAttention } from '../controllers/dashboardController.js';
import { getEquipmentList, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js';
import { getMaintenanceList, createMaintenance, updateMaintenance, completeMaintenance } from '../controllers/maintenanceController.js';
import { getCalibrations, createCalibration } from '../controllers/calibrationController.js';
import { getWarranties, createWarranty, updateWarranty } from '../controllers/warrantyController.js';
import { getServiceRequests, createServiceRequest, updateServiceRequest } from '../controllers/serviceRequestController.js';
import { getUtilizationLogs, getUtilizationAnalytics, logUtilization } from '../controllers/utilizationController.js';
import { getMaintenanceReport, getCalibrationReport, getWarrantyReport, getUtilizationReport, exportReportCsv } from '../controllers/reportController.js';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';

const router = Router();

// System Health & Redis Status
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
    cache: redisService.getStatus(),
  });
});

// Authentication
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getUsers);

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

// Preventive Maintenance
router.get('/maintenance', getMaintenanceList);
router.post('/maintenance', authenticateToken, requireRole(['admin', 'biomedical_engineer']), createMaintenance);
router.put('/maintenance/:id', authenticateToken, requireRole(['admin', 'biomedical_engineer']), updateMaintenance);
router.put('/maintenance/:id/complete', authenticateToken, requireRole(['admin', 'biomedical_engineer']), completeMaintenance);

// Calibration Management
router.get('/calibrations', getCalibrations);
router.post('/calibrations', authenticateToken, requireRole(['admin', 'biomedical_engineer']), createCalibration);

// Warranty Management
router.get('/warranties', getWarranties);
router.post('/warranties', authenticateToken, requireRole(['admin', 'biomedical_engineer']), createWarranty);
router.put('/warranties/:id', authenticateToken, requireRole(['admin', 'biomedical_engineer']), updateWarranty);

// Service & Repair History
router.get('/service-requests', getServiceRequests);
router.post('/service-requests', authenticateToken, createServiceRequest); // Any hospital staff can report
router.put('/service-requests/:id', authenticateToken, requireRole(['admin', 'biomedical_engineer']), updateServiceRequest);

// Utilization Tracking
router.get('/utilization', getUtilizationLogs);
router.get('/utilization/analytics', getUtilizationAnalytics);
router.post('/utilization', authenticateToken, requireRole(['admin', 'biomedical_engineer']), logUtilization);

// Reports & CSV Export
router.get('/reports/maintenance', getMaintenanceReport);
router.get('/reports/calibration', getCalibrationReport);
router.get('/reports/warranty', getWarrantyReport);
router.get('/reports/utilization', getUtilizationReport);
router.get('/reports/export', exportReportCsv);

// Notifications
router.get('/notifications', authenticateToken, getNotifications);
router.put('/notifications/:id/read', authenticateToken, markAsRead);
router.put('/notifications/mark-all-read', authenticateToken, markAllAsRead);
router.post('/notifications', authenticateToken, createNotification);

export default router;
