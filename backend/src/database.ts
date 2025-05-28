import { DatabaseConnection } from './database/connection';
import { DatabaseFactory } from './database/factory';
import { logger } from './logger';

export class Database {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseFactory.createFromEnvironment();
  }

  async initialize(): Promise<void> {
    try {
      await this.connection.initialize();
      const connectionInfo = DatabaseFactory.getConnectionInfo();
      logger.info(`✅ Database initialized: ${connectionInfo.type} (${connectionInfo.info})`);
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  public getConnection(): DatabaseConnection {
    return this.connection;
  }

  // Legacy method for backward compatibility
  public getDb(): any {
    return this.connection;
  }

  public async close(): Promise<void> {
    await this.connection.close();
  }

  // Query methods that delegate to the connection
  async query(sql: string, params?: any[]) {
    return this.connection.query(sql, params);
  }

  async run(sql: string, params?: any[]) {
    return this.connection.run(sql, params);
  }

  async get(sql: string, params?: any[]) {
    return this.connection.get(sql, params);
  }

  async all(sql: string, params?: any[]) {
    return this.connection.all(sql, params);
  }
}

export interface UserSettings {
  id?: number;
  api_key_encrypted?: string;
  api_secret_encrypted?: string;
  purchase_amount?: number;
  purchase_interval?: number;
  is_bot_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseHistory {
  id?: number;
  purchase_date: string;
  amount_usd: number;
  btc_quantity: number;
  btc_price: number;
  order_id?: string;
  status: 'success' | 'failed';
  error_message?: string;
  created_at?: string;
}

export const database = new Database();