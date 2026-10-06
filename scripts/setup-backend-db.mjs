import { readFile } from 'node:fs/promises';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL before running database setup.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
});
try {
  const migration = await readFile(new URL('../db/0001_admin_backend.sql', import.meta.url), 'utf8');
  await pool.query(migration);
  console.log('FHA admin backend tables are ready. The website also checks and creates them on first use.');
} catch (error) {
  console.error('Backend database setup failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
