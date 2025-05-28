import { DatabaseConnection, PostgreSQLConnection, SQLiteConnection, DatabaseConfig, DatabaseType } from './connection';
import { logger } from '../logger';

export class DatabaseFactory {
  private static connection: DatabaseConnection | null = null;

  static create(config: DatabaseConfig): DatabaseConnection {
    logger.info(`🔧 Creating ${config.type} database connection`);
    
    switch (config.type) {
      case 'postgresql':
        return new PostgreSQLConnection(config);
      case 'sqlite':
        return new SQLiteConnection(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  static getConnection(): DatabaseConnection {
    if (!this.connection) {
      this.connection = this.createFromEnvironment();
    }
    return this.connection;
  }

  static createFromEnvironment(): DatabaseConnection {
    const DATABASE_URL = process.env.DATABASE_URL;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    if (DATABASE_URL) {
      // Parse PostgreSQL connection string
      if (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')) {
        logger.info('🐘 Using PostgreSQL from DATABASE_URL');
        return this.create({
          type: 'postgresql',
          url: DATABASE_URL,
          ssl: NODE_ENV === 'production'
        });
      }
    }

    // Check for individual PostgreSQL environment variables
    const PG_HOST = process.env.PG_HOST || process.env.POSTGRES_HOST;
    const PG_PORT = process.env.PG_PORT || process.env.POSTGRES_PORT;
    const PG_DB = process.env.PG_DATABASE || process.env.POSTGRES_DB || 'dca_bot';
    const PG_USER = process.env.PG_USER || process.env.POSTGRES_USER;
    const PG_PASSWORD = process.env.PG_PASSWORD || process.env.POSTGRES_PASSWORD;

    if (PG_HOST && PG_USER && PG_PASSWORD) {
      logger.info('🐘 Using PostgreSQL from individual environment variables');
      return this.create({
        type: 'postgresql',
        host: PG_HOST,
        port: parseInt(PG_PORT || '5432'),
        database: PG_DB,
        username: PG_USER,
        password: PG_PASSWORD,
        ssl: NODE_ENV === 'production'
      });
    }

    // Fallback to SQLite
    const sqlitePath = process.env.DATABASE_PATH || './data/dca_bot.db';
    logger.info('📁 Using SQLite database');
    return this.create({
      type: 'sqlite',
      filePath: sqlitePath
    });
  }

  static getConnectionInfo(): { type: DatabaseType; info: string } {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (DATABASE_URL) {
      if (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')) {
        const url = new URL(DATABASE_URL);
        return {
          type: 'postgresql',
          info: `${url.hostname}:${url.port}/${url.pathname.slice(1)}`
        };
      }
    }

    const PG_HOST = process.env.PG_HOST || process.env.POSTGRES_HOST;
    if (PG_HOST) {
      const PG_PORT = process.env.PG_PORT || process.env.POSTGRES_PORT || '5432';
      const PG_DB = process.env.PG_DATABASE || process.env.POSTGRES_DB || 'dca_bot';
      return {
        type: 'postgresql',
        info: `${PG_HOST}:${PG_PORT}/${PG_DB}`
      };
    }

    const sqlitePath = process.env.DATABASE_PATH || './data/dca_bot.db';
    return {
      type: 'sqlite',
      info: sqlitePath
    };
  }
}