import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import type { DbConnectionInfo } from '../src/types/dbms.ts';

let mysqlPool: mysql.Pool | null = null;
let mysqlConnected = false;
let mysqlLastError: string | null = null;

let mongoClient: MongoClient | null = null;
let mongoConnected = false;

export function isMysqlConfigured(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      process.env.MYSQL_DATABASE
  );
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function initDatabases(): Promise<void> {
  if (isMysqlConfigured()) {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true,
      });
      const conn = await mysqlPool.getConnection();
      await conn.ping();
      conn.release();
      mysqlConnected = true;
      mysqlLastError = null;
      console.log('[DB] Connected to MySQL 8.0+ database:', process.env.MYSQL_DATABASE);
    } catch (err) {
      mysqlConnected = false;
      mysqlLastError = err instanceof Error ? err.message : 'Unable to connect to MySQL';
      console.warn('[DB] MySQL connection failed, falling back to Sample Preview mode:', mysqlLastError);
    }
  } else {
    mysqlConnected = false;
    mysqlLastError = null;
  }

  if (isMongoConfigured()) {
    try {
      mongoClient = new MongoClient(process.env.MONGODB_URI!);
      await mongoClient.connect();
      mongoConnected = true;
      console.log('[DB] Connected to MongoDB:', process.env.MONGODB_DATABASE || 'smart_parking_events');
    } catch (err) {
      mongoConnected = false;
      console.warn('[DB] MongoDB connection failed, falling back to Sample Preview mode:', err instanceof Error ? err.message : err);
    }
  }
}

export function getMysqlPool(): mysql.Pool | null {
  return mysqlConnected ? mysqlPool : null;
}

export function getMongoDb() {
  if (!mongoConnected || !mongoClient) return null;
  return mongoClient.db(process.env.MONGODB_DATABASE || 'smart_parking_events');
}

export function getDbInfo(): DbConnectionInfo {
  return {
    dbMode: mysqlConnected ? 'mysql-live' : 'sample-preview',
    mysqlConfigured: isMysqlConfigured(),
    mysqlConnected,
    mysqlError: mysqlLastError,
    mongoMode: mongoConnected ? 'mongodb-live' : 'sample-preview',
    mongoConfigured: isMongoConfigured(),
    mongoConnected,
  };
}
