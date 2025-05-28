import { Pool, Client } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';

export type DatabaseType = 'sqlite' | 'postgresql';

export interface DatabaseConfig {
  type: DatabaseType;
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  filePath?: string;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  lastInsertId?: number;
}

export abstract class DatabaseConnection {
  abstract query(sql: string, params?: any[]): Promise<QueryResult>;
  abstract run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertId?: number }>;
  abstract get(sql: string, params?: any[]): Promise<any>;
  abstract all(sql: string, params?: any[]): Promise<any[]>;
  abstract close(): Promise<void>;
  abstract initialize(): Promise<void>;
}

export class PostgreSQLConnection extends DatabaseConnection {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    super();
    
    const poolConfig = config.url ? {
      connectionString: config.url,
      ssl: config.ssl ? { rejectUnauthorized: false } : false
    } : {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false
    };

    this.pool = new Pool({
      ...poolConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('✅ Connected to PostgreSQL database');
      await this.createTables();
    } catch (error) {
      logger.error('❌ Error connecting to PostgreSQL:', error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0
      };
    } finally {
      client.release();
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertId?: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return {
        changes: result.rowCount || 0,
        lastInsertId: result.rows[0]?.id
      };
    } finally {
      client.release();
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.query(sql, params);
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('PostgreSQL connection closed');
  }

  private async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserSettingsTable = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        api_key_encrypted TEXT,
        api_secret_encrypted TEXT,
        purchase_amount DECIMAL(10,2),
        purchase_interval DECIMAL(10,2),
        is_bot_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPurchaseHistoryTable = `
      CREATE TABLE IF NOT EXISTS purchase_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        purchase_date TIMESTAMP,
        amount_usd DECIMAL(10,2),
        btc_quantity DECIMAL(18,8),
        btc_price DECIMAL(12,2),
        order_id VARCHAR(255),
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id ON purchase_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_history_date ON purchase_history(purchase_date)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'
    ];

    try {
      logger.info('📋 Creating PostgreSQL tables...');
      
      await this.query(createUsersTable);
      logger.info('✅ users table ready');
      
      await this.query(createUserSettingsTable);
      logger.info('✅ user_settings table ready');
      
      await this.query(createPurchaseHistoryTable);
      logger.info('✅ purchase_history table ready');

      for (const indexQuery of createIndexes) {
        await this.query(indexQuery);
      }
      logger.info('✅ indexes created');

    } catch (error) {
      logger.error('❌ Error creating PostgreSQL tables:', error);
      throw error;
    }
  }
}

export class SQLiteConnection extends DatabaseConnection {
  private db: sqlite3.Database;
  private initialized = false;

  constructor(config: DatabaseConfig) {
    super();
    
    const dbPath = config.filePath || './data/dca_bot.db';
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      this.db.on('open', async () => {
        try {
          logger.info('✅ Connected to SQLite database');
          await this.createTables();
          this.initialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.db.on('error', (error) => {
        logger.error('❌ SQLite error:', error);
        reject(error);
      });
    });
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0
          });
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertId?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            changes: this.changes,
            lastInsertId: this.lastID
          });
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing SQLite database:', err);
        } else {
          logger.info('SQLite database connection closed');
        }
        resolve();
      });
    });
  }

  private async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserSettingsTable = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        api_key_encrypted TEXT,
        api_secret_encrypted TEXT,
        purchase_amount REAL,
        purchase_interval REAL,
        is_bot_active BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createPurchaseHistoryTable = `
      CREATE TABLE IF NOT EXISTS purchase_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        purchase_date DATETIME,
        amount_usd REAL,
        btc_quantity REAL,
        btc_price REAL,
        order_id TEXT,
        status TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    try {
      logger.info('📋 Creating SQLite tables...');
      
      await this.run(createUsersTable);
      logger.info('✅ users table ready');
      
      await this.run(createUserSettingsTable);
      logger.info('✅ user_settings table ready');
      
      await this.run(createPurchaseHistoryTable);
      logger.info('✅ purchase_history table ready');

    } catch (error) {
      logger.error('❌ Error creating SQLite tables:', error);
      throw error;
    }
  }
}