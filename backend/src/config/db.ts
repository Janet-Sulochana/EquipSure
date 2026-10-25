import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl:
          process.env.PGSSL === 'true' ||
          (isProduction && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'))
            ? { rejectUnauthorized: false }
            : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'equipsuredb',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected idle client error:', err.message);
});

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as db');
    client.release();
    console.log(`[PostgreSQL] Connected successfully to "${result.rows[0].db}" at ${result.rows[0].current_time}`);
    return true;
  } catch (error: any) {
    console.error('[PostgreSQL] Database connection failed:', error.message);
    return false;
  }
}

export default pool;
