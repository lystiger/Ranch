import { createPool, type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { env } from "../lib/env";

let pool: Pool | null = null;

export function getRawDb(): Pool {
  if (!pool) {
    pool = createPool({
      uri: env.databaseUrl,
      connectionLimit: 10,
      multipleStatements: true,
    });
  }
  return pool;
}

export async function runQuery(sql: string, params?: any[]): Promise<any[]> {
  const db = getRawDb();
  const [rows] = await db.execute<RowDataPacket[]>(sql, params ?? []);
  return rows;
}

export async function runInsert(sql: string, params?: any[]): Promise<{ insertId: number; affectedRows: number }> {
  const db = getRawDb();
  const [result] = await db.execute<ResultSetHeader>(sql, params ?? []);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
}

export async function runUpdate(sql: string, params?: any[]): Promise<{ affectedRows: number }> {
  const db = getRawDb();
  const [result] = await db.execute<ResultSetHeader>(sql, params ?? []);
  return { affectedRows: result.affectedRows };
}
