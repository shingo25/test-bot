import { DatabaseConnection } from './connection';
import { UserSettings, PurchaseHistory } from '../database';

export class DatabaseQueries {
  constructor(private connection: DatabaseConnection) {}

  // User Settings Queries
  async getUserSettings(userId?: number): Promise<any> {
    if (userId) {
      // Multi-user mode
      return this.connection.get(
        'SELECT * FROM user_settings WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      );
    } else {
      // Legacy single-user mode
      return this.connection.get(
        'SELECT * FROM user_settings ORDER BY id DESC LIMIT 1'
      );
    }
  }

  async saveApiKeys(apiKeyEncrypted: string, apiSecretEncrypted: string, userId?: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (userId) {
        // Multi-user mode
        const existing = await this.connection.get(
          'SELECT id FROM user_settings WHERE user_id = ?',
          [userId]
        );

        if (existing) {
          await this.connection.run(
            'UPDATE user_settings SET api_key_encrypted = ?, api_secret_encrypted = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [apiKeyEncrypted, apiSecretEncrypted, userId]
          );
        } else {
          await this.connection.run(
            'INSERT INTO user_settings (user_id, api_key_encrypted, api_secret_encrypted, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, apiKeyEncrypted, apiSecretEncrypted]
          );
        }
      } else {
        // Legacy single-user mode
        const existing = await this.connection.get('SELECT id FROM user_settings WHERE id = 1');

        if (existing) {
          await this.connection.run(
            'UPDATE user_settings SET api_key_encrypted = ?, api_secret_encrypted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
            [apiKeyEncrypted, apiSecretEncrypted]
          );
        } else {
          await this.connection.run(
            'INSERT INTO user_settings (id, api_key_encrypted, api_secret_encrypted, updated_at) VALUES (1, ?, ?, CURRENT_TIMESTAMP)',
            [apiKeyEncrypted, apiSecretEncrypted]
          );
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateDCASettings(purchaseAmount: number, purchaseInterval: number, userId?: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (userId) {
        // Multi-user mode
        const existing = await this.connection.get(
          'SELECT id FROM user_settings WHERE user_id = ?',
          [userId]
        );

        if (existing) {
          await this.connection.run(
            'UPDATE user_settings SET purchase_amount = ?, purchase_interval = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [purchaseAmount, purchaseInterval, userId]
          );
        } else {
          await this.connection.run(
            'INSERT INTO user_settings (user_id, purchase_amount, purchase_interval, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, purchaseAmount, purchaseInterval]
          );
        }
      } else {
        // Legacy single-user mode
        const existing = await this.connection.get('SELECT id FROM user_settings WHERE id = 1');

        if (existing) {
          await this.connection.run(
            'UPDATE user_settings SET purchase_amount = ?, purchase_interval = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
            [purchaseAmount, purchaseInterval]
          );
        } else {
          await this.connection.run(
            'INSERT INTO user_settings (id, purchase_amount, purchase_interval, updated_at) VALUES (1, ?, ?, CURRENT_TIMESTAMP)',
            [purchaseAmount, purchaseInterval]
          );
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateBotStatus(isActive: boolean, userId?: number): Promise<void> {
    if (userId) {
      await this.connection.run(
        'UPDATE user_settings SET is_bot_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [isActive, userId]
      );
    } else {
      await this.connection.run(
        'UPDATE user_settings SET is_bot_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT MAX(id) FROM user_settings)',
        [isActive]
      );
    }
  }

  // Purchase History Queries
  async savePurchaseHistory(purchase: PurchaseHistory, userId?: number): Promise<void> {
    const {
      purchase_date,
      amount_usd,
      btc_quantity,
      btc_price,
      order_id,
      status,
      error_message
    } = purchase;

    await this.connection.run(
      `INSERT INTO purchase_history 
       (user_id, purchase_date, amount_usd, btc_quantity, btc_price, order_id, status, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, purchase_date, amount_usd, btc_quantity, btc_price, order_id, status, error_message]
    );
  }

  async getPurchaseHistory(limit: number = 50, offset: number = 0, userId?: number): Promise<any[]> {
    if (userId) {
      return this.connection.all(
        'SELECT * FROM purchase_history WHERE user_id = ? ORDER BY purchase_date DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
    } else {
      return this.connection.all(
        'SELECT * FROM purchase_history ORDER BY purchase_date DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
    }
  }

  async getStatistics(userId?: number): Promise<any> {
    const whereClause = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const result = await this.connection.get(
      `SELECT 
         COUNT(*) as total_purchases,
         SUM(CASE WHEN status = 'success' THEN amount_usd ELSE 0 END) as total_spent,
         SUM(CASE WHEN status = 'success' THEN btc_quantity ELSE 0 END) as total_btc,
         AVG(CASE WHEN status = 'success' THEN btc_price ELSE NULL END) as avg_price,
         COUNT(CASE WHEN status = 'success' THEN 1 ELSE NULL END) as successful_purchases,
         COUNT(CASE WHEN status = 'failed' THEN 1 ELSE NULL END) as failed_purchases
       FROM purchase_history ${whereClause}`,
      params
    );

    return {
      total_purchases: result.total_purchases || 0,
      total_spent: result.total_spent || 0,
      total_btc: result.total_btc || 0,
      avg_price: result.avg_price || 0,
      successful_purchases: result.successful_purchases || 0,
      failed_purchases: result.failed_purchases || 0,
      success_rate: result.total_purchases > 0 
        ? ((result.successful_purchases || 0) / result.total_purchases * 100).toFixed(2)
        : '0.00'
    };
  }

  // Migration helper
  async migrateFromSQLiteToPostgreSQL(sqliteData: any): Promise<void> {
    // This would be implemented if we need to migrate existing SQLite data
    // For now, we'll start fresh with PostgreSQL
    console.log('Migration helper - not implemented yet');
  }
}