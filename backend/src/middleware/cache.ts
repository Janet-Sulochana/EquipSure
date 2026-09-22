import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService.js';

export function cacheMiddleware(ttlSeconds: number = 60, keyPrefix?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${keyPrefix || 'route'}:${req.originalUrl || req.url}`;

    try {
      const cached = await redisService.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Only cache successful 200 responses
        if (res.statusCode === 200 && body && body.success !== false) {
          redisService.set(key, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next();
    }
  };
}
