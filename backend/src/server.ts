import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { testDbConnection } from './config/db.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', router);

// Root greeting
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'EquipSure API',
    description: 'Biomedical Equipment Management System for Hospitals',
    version: '1.0.0',
    docs: '/api/system/status',
  });
});

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[EquipSure Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Bootstrapping
async function bootstrap() {
  console.log('====================================================');
  console.log('  EquipSure - Biomedical Equipment Management System');
  console.log('====================================================');

  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.warn('[Warning] PostgreSQL connection failed at bootstrap. Verify connection parameters.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] EquipSure REST API running on http://localhost:${PORT}`);
    console.log(`[Server] Healthcheck: http://localhost:${PORT}/api/system/status`);
    console.log('====================================================');
  });
}

bootstrap();

export default app;
