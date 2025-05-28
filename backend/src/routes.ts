import express from 'express';
import { UserSettings, PurchaseHistory } from './database';
import { DatabaseFactory } from './database/factory';
import { BinanceService } from './binanceService';
import { EncryptionService } from './encryption';
import { dcaEngine } from './dcaEngine';

const router = express.Router();

// API Key Settings
router.post('/settings/apikey', async (req, res) => {
  try {
    console.log('📝 Received API key setup request');
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      console.log('❌ Missing API key or secret');
      return res.status(400).json({ error: 'API key and secret are required' });
    }

    console.log('🔑 API key length:', apiKey.length);
    console.log('🔐 API secret length:', apiSecret.length);

    console.log('🌐 Testing Binance connection...');
    const testService = new BinanceService(apiKey, apiSecret, true);
    const connectionTest = await testService.testConnection();

    if (!connectionTest.success) {
      console.log('❌ Binance connection failed:', connectionTest.error);
      return res.status(400).json({ error: connectionTest.error });
    }

    console.log('✅ Binance connection successful');
    console.log('🔒 Encrypting API credentials...');
    const encryptedKey = EncryptionService.encrypt(apiKey);
    const encryptedSecret = EncryptionService.encrypt(apiSecret);

    console.log('💾 Saving to database...');
    
    try {
      const db = DatabaseFactory.getConnection();
      
      // 既存レコードがあるかチェック
      const existingRow = await db.get('SELECT id FROM user_settings WHERE id = 1');
      
      if (existingRow) {
        // 既存レコードがある場合はAPIキーのみ更新
        console.log('📝 Updating existing record with API keys');
        await db.run(
          `UPDATE user_settings 
           SET api_key_encrypted = ?, api_secret_encrypted = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = 1`,
          [encryptedKey, encryptedSecret]
        );
        console.log('✅ API keys updated successfully');
        res.json({ success: true, balance: connectionTest.balance });
      } else {
        // 新規レコード作成
        console.log('🆕 Creating new record with API keys');
        await db.run(
          `INSERT INTO user_settings 
           (id, api_key_encrypted, api_secret_encrypted, updated_at) 
           VALUES (1, ?, ?, CURRENT_TIMESTAMP)`,
          [encryptedKey, encryptedSecret]
        );
        console.log('✅ API keys inserted successfully');
        res.json({ success: true, balance: connectionTest.balance });
      }
    } catch (error: any) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to save API keys' });
    }
  } catch (error: any) {
    console.error('❌ API key setup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get Settings
router.get('/settings', async (req, res) => {
  try {
    const db = DatabaseFactory.getConnection();
    const row = await db.get(
      'SELECT purchase_amount, purchase_interval, is_bot_active FROM user_settings ORDER BY id DESC LIMIT 1'
    );
    
    res.json(row || {
      purchase_amount: null,
      purchase_interval: null,
      is_bot_active: false
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Settings
router.put('/settings', async (req, res) => {
  try {
    const { purchase_amount, purchase_interval } = req.body;

    console.log('📝 Received settings update:', { purchase_amount, purchase_interval, types: { amount: typeof purchase_amount, interval: typeof purchase_interval } });

    if (purchase_amount === undefined || purchase_amount === null || purchase_interval === undefined || purchase_interval === null) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Purchase amount and interval are required' });
    }

    const amount = parseFloat(purchase_amount);
    const interval = parseFloat(purchase_interval);

    if (isNaN(amount) || isNaN(interval)) {
      console.log('❌ Invalid number format');
      return res.status(400).json({ error: 'Invalid number format for amount or interval' });
    }

    if (amount < 10) {
      console.log('❌ Amount too small:', amount);
      return res.status(400).json({ error: 'Minimum purchase amount is 10 USDT' });
    }

    if (interval <= 0) {
      console.log('❌ Invalid interval:', interval);
      return res.status(400).json({ error: 'Interval must be greater than 0' });
    }

    console.log('💰 Updating DCA settings:', { purchase_amount: amount, purchase_interval: interval });

    const db = DatabaseFactory.getConnection();
    
    // 既存のレコードを更新（APIキーは保持）
    const result = await db.run(
      `UPDATE user_settings 
       SET purchase_amount = ?, purchase_interval = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
      [amount, interval]
    );
    
    if (result.changes === 0) {
      // レコードが存在しない場合は新規作成（APIキーなし）
      console.log('⚠️ No existing record found, creating new one without API keys');
      await db.run(
        `INSERT INTO user_settings (id, purchase_amount, purchase_interval, updated_at) 
         VALUES (1, ?, ?, CURRENT_TIMESTAMP)`,
        [amount, interval]
      );
      console.log('✅ DCA settings created successfully');
    } else {
      console.log('✅ DCA settings updated successfully, rows affected:', result.changes);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Test Connection
router.post('/test-connection', async (req, res) => {
  try {
    const db = DatabaseFactory.getConnection();
    const row = await db.get(
      'SELECT api_key_encrypted, api_secret_encrypted FROM user_settings ORDER BY id DESC LIMIT 1'
    );
    
    if (!row || !row.api_key_encrypted || !row.api_secret_encrypted) {
      return res.status(400).json({ error: 'API keys not configured' });
    }

    const apiKey = EncryptionService.decrypt(row.api_key_encrypted);
    const apiSecret = EncryptionService.decrypt(row.api_secret_encrypted);

    const testService = new BinanceService(apiKey, apiSecret, true);
    const result = await testService.testConnection();

    res.json(result);
  } catch (error: any) {
    console.error('Connection test error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Bot Control
router.post('/bot/start', async (req, res) => {
  try {
    const result = await dcaEngine.startBot();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Start bot error:', error);
    res.status(500).json({ error: error.message || 'Failed to start bot' });
  }
});

router.post('/bot/stop', async (req, res) => {
  try {
    const result = await dcaEngine.stopBot();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Stop bot error:', error);
    res.status(500).json({ error: error.message || 'Failed to stop bot' });
  }
});

router.get('/bot/status', async (req, res) => {
  try {
    const status = await dcaEngine.getBotStatus();
    res.json(status);
  } catch (error: any) {
    console.error('Bot status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get bot status' });
  }
});

// Purchase History
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const db = DatabaseFactory.getConnection();
    const rows = await db.all(
      `SELECT * FROM purchase_history 
       ORDER BY purchase_date DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    res.json(rows || []);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Debug endpoint to check database contents
router.get('/debug/database', async (req, res) => {
  try {
    const db = DatabaseFactory.getConnection();
    const row = await db.get('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
    
    res.json({
      settings: row ? {
        id: row.id,
        hasApiKey: !!row.api_key_encrypted,
        hasApiSecret: !!row.api_secret_encrypted,
        apiKeyLength: row.api_key_encrypted?.length,
        apiSecretLength: row.api_secret_encrypted?.length,
        purchase_amount: row.purchase_amount,
        purchase_interval: row.purchase_interval,
        is_bot_active: row.is_bot_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      } : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics
router.get('/statistics', async (req, res) => {
  try {
    const db = DatabaseFactory.getConnection();
    const rows = await db.all(
      `SELECT 
         COUNT(*) as total_purchases,
         SUM(CASE WHEN status = 'success' THEN amount_usd ELSE 0 END) as total_spent,
         SUM(CASE WHEN status = 'success' THEN btc_quantity ELSE 0 END) as total_btc,
         AVG(CASE WHEN status = 'success' THEN btc_price ELSE NULL END) as avg_price,
         COUNT(CASE WHEN status = 'success' THEN 1 ELSE NULL END) as successful_purchases,
         COUNT(CASE WHEN status = 'failed' THEN 1 ELSE NULL END) as failed_purchases
       FROM purchase_history`
    );
    
    const stats = rows[0] || {};
    res.json({
      total_purchases: stats.total_purchases || 0,
      total_spent: stats.total_spent || 0,
      total_btc: stats.total_btc || 0,
      avg_price: stats.avg_price || 0,
      successful_purchases: stats.successful_purchases || 0,
      failed_purchases: stats.failed_purchases || 0,
      success_rate: stats.total_purchases > 0 
        ? ((stats.successful_purchases || 0) / stats.total_purchases * 100).toFixed(2)
        : '0.00'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;