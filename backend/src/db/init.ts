import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';

function findSqlFile(filename: string): string {
  const dir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const candidates = [
    path.join(dir, filename),
    path.join(dir, '..', '..', 'src', 'db', filename),
    path.join(process.cwd(), 'src', 'db', filename),
    path.join(process.cwd(), 'dist', 'db', filename),
    path.join(process.cwd(), filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`SQL file "${filename}" could not be located in search paths: ${candidates.join(', ')}`);
}

export async function runSchemaMigration(): Promise<void> {
  console.log('[EquipSure DB] Running schema migration...');
  const schemaPath = findSqlFile('schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  console.log('[EquipSure DB] Schema migration completed successfully.');
}

async function main() {
  try {
    await runSchemaMigration();
    process.exit(0);
  } catch (err: any) {
    console.error('[EquipSure DB] Migration failed:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes('init')) {
  main();
}
