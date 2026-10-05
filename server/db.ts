import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
}

let dbInstance: DatabaseClient | null = null;

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((lat2 - lat1) * Math.PI) / 180;
  const longitudeDelta = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

export async function getDb(): Promise<DatabaseClient> {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && !process.env.SQL_HOST) {
    throw new Error('DATABASE_URL or SQL_HOST must be configured. FixMate requires PostgreSQL.');
  }

  const pool = new pg.Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined,
        }
  );

  const client = await pool.connect();
  client.release();
  dbInstance = {
    query: async (text: string, params?: any[]) => {
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    },
  };

  const schema = await fs.readFile(path.resolve(process.cwd(), 'schema.sql'), 'utf8');
  await dbInstance.query(schema);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail || adminPassword) {
    if (!adminEmail || !adminPassword || adminPassword.length < 7) {
      throw new Error('Set both ADMIN_EMAIL and an ADMIN_PASSWORD with at least 7 characters.');
    }

    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await dbInstance.query(
      `INSERT INTO users (email, password_hash, role, full_name, email_verified)
       VALUES ($1, $2, 'admin', $3, true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         full_name = EXCLUDED.full_name,
         email_verified = true,
         updated_at = CURRENT_TIMESTAMP`,
      [adminEmail, adminPasswordHash, process.env.ADMIN_NAME?.trim() || 'FixMate Administrator']
    );
  }

  console.log('Connected to PostgreSQL and applied the database schema.');
  return dbInstance;
}
