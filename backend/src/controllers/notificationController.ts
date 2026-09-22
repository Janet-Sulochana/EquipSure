import { Request, Response } from 'express';
import pool from '../config/db.js';
import redisService from '../services/redisService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user ? req.user.id : null;

    // Fetch broadcast notifications (user_id IS NULL) + user-specific notifications
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCountResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM notifications
      WHERE is_read = false AND (user_id IS NULL OR user_id = $1)
    `, [userId]);

    return res.json({
      success: true,
      unreadCount: unreadCountResult.rows[0].count,
      data: result.rows,
      redisStatus: redisService.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      notification: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user ? req.user.id : null;

    await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE is_read = false AND (user_id IS NULL OR user_id = $1)
    `, [userId]);

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createNotification(req: Request, res: Response) {
  const { user_id, type, title, message, link } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Type, title, and message are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id || null, type, title, message, link || null]
    );

    // Publish to Redis
    await redisService.publishNotification('notifications:new', result.rows[0]);

    return res.status(201).json({
      success: true,
      notification: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
