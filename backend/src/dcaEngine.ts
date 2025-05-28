import * as cron from 'node-cron';
import { UserSettings, PurchaseHistory } from './database';
import { DatabaseFactory } from './database/factory';
import { BinanceService } from './binanceService';
import { EncryptionService } from './encryption';
import { logger } from './logger';

export class DCAEngine {
  private cronJob: cron.ScheduledTask | null = null;
  private binanceService: BinanceService;
  private isRunning = false;

  constructor() {
    this.binanceService = new BinanceService();
  }

  public async startBot(): Promise<{ success: boolean; message: string }> {
    try {
      logger.bot('🚀 Starting DCA bot...');
      const settings = await this.getUserSettings();
      logger.debug('📊 Retrieved settings:', {
        hasSettings: !!settings,
        hasApiKey: !!(settings?.api_key_encrypted),
        hasApiSecret: !!(settings?.api_secret_encrypted),
        purchaseAmount: settings?.purchase_amount,
        purchaseInterval: settings?.purchase_interval
      });
      
      if (!settings || !settings.api_key_encrypted || !settings.api_secret_encrypted) {
        logger.error('❌ API keys not found in database');
        return { success: false, message: 'API keys not configured' };
      }

      if (!settings.purchase_amount || !settings.purchase_interval) {
        logger.error('❌ Purchase settings not configured');
        return { success: false, message: 'Purchase settings not configured' };
      }

      const apiKey = EncryptionService.decrypt(settings.api_key_encrypted);
      const apiSecret = EncryptionService.decrypt(settings.api_secret_encrypted);

      this.binanceService = new BinanceService(apiKey, apiSecret, true); // testMode = true

      const connectionTest = await this.binanceService.testConnection();
      if (!connectionTest.success) {
        return { success: false, message: `API connection failed: ${connectionTest.error}` };
      }

      const cronExpression = this.intervalToCron(settings.purchase_interval);
      console.log('⏰ Cron expression:', cronExpression);
      
      // 秒単位の場合はタイムゾーンオプション無しで使用
      const cronOptions = settings.purchase_interval < 1 ? {} : { timezone: 'UTC' };
      
      this.cronJob = cron.schedule(cronExpression, async () => {
        console.log('⏰ Cron job triggered at:', new Date().toISOString());
        await this.executePurchase();
      }, cronOptions);
      
      this.cronJob.start();
      console.log('✅ Cron job started successfully');

      await this.updateBotStatus(true);
      this.isRunning = true;

      return { success: true, message: 'DCA bot started successfully' };
    } catch (error: any) {
      console.error('Error starting bot:', error);
      return { success: false, message: error.message || 'Failed to start bot' };
    }
  }

  public async stopBot(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob.destroy();
        this.cronJob = null;
      }

      await this.updateBotStatus(false);
      this.isRunning = false;

      return { success: true, message: 'DCA bot stopped successfully' };
    } catch (error: any) {
      console.error('Error stopping bot:', error);
      return { success: false, message: error.message || 'Failed to stop bot' };
    }
  }

  public async getBotStatus(): Promise<{
    isRunning: boolean;
    nextExecution?: string;
    settings?: UserSettings;
  }> {
    try {
      const settings = await this.getUserSettings();
      let nextExecution: string | undefined;

      if (this.isRunning && this.cronJob && settings?.purchase_interval) {
        const now = new Date();
        const intervalMs = settings.purchase_interval * 60 * 1000;
        nextExecution = new Date(now.getTime() + intervalMs).toISOString();
      }

      return {
        isRunning: this.isRunning,
        nextExecution,
        settings: settings || undefined
      };
    } catch (error) {
      console.error('Error getting bot status:', error);
      return { isRunning: false };
    }
  }

  private async executePurchase(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      logger.purchase('🛒 ===== EXECUTING DCA PURCHASE =====');
      
      const settings = await this.getUserSettings();
      if (!settings || !settings.purchase_amount) {
        logger.error('❌ No purchase settings found');
        return;
      }

      logger.info('💰 Purchase settings:', {
        amount: settings.purchase_amount + ' USDT',
        interval: settings.purchase_interval + ' minutes'
      });

      logger.debug('🏦 Checking account balance...');
      const balance = await this.binanceService.getAccountBalance();
      logger.debug('💳 Current balance:', {
        usdt: balance.usdt + ' USDT',
        btc: balance.btc + ' BTC'
      });

      if (balance.usdt < settings.purchase_amount) {
        const errorMsg = `Insufficient balance: ${balance.usdt} USDT < ${settings.purchase_amount} USDT`;
        logger.error('❌', errorMsg);
        
        await this.savePurchaseHistory({
          purchase_date: timestamp,
          amount_usd: settings.purchase_amount,
          btc_quantity: 0,
          btc_price: 0,
          status: 'failed',
          error_message: errorMsg
        });
        return;
      }

      logger.debug('📈 Getting current BTC price...');
      const currentPrice = await this.binanceService.getCurrentBTCPrice();
      logger.info('💲 Current BTC price:', '$' + currentPrice.toLocaleString());

      logger.info('🛒 Attempting to purchase BTC...');
      const purchase = await this.binanceService.purchaseBTC(settings.purchase_amount);
      
      if (purchase.success) {
        logger.purchase('✅ PURCHASE SUCCESSFUL!');
        logger.purchase('📊 Purchase details:', {
          orderId: purchase.orderId,
          quantity: purchase.quantity + ' BTC',
          price: '$' + (purchase.price || 0).toLocaleString(),
          totalCost: settings.purchase_amount + ' USDT'
        });
        
        await this.savePurchaseHistory({
          purchase_date: timestamp,
          amount_usd: settings.purchase_amount,
          btc_quantity: purchase.quantity || 0,
          btc_price: purchase.price || 0,
          order_id: purchase.orderId,
          status: 'success'
        });
        
        logger.info('💾 Purchase record saved to database');
      } else {
        logger.error('❌ PURCHASE FAILED:', purchase.error);
        
        await this.savePurchaseHistory({
          purchase_date: timestamp,
          amount_usd: settings.purchase_amount,
          btc_quantity: 0,
          btc_price: 0,
          status: 'failed',
          error_message: purchase.error
        });
        
        logger.info('💾 Failure record saved to database');
      }
      
      logger.purchase('🛒 ===== PURCHASE EXECUTION COMPLETED =====');
    } catch (error: any) {
      logger.error('❌ ERROR EXECUTING PURCHASE:', error);
      
      const settings = await this.getUserSettings();
      await this.savePurchaseHistory({
        purchase_date: new Date().toISOString(),
        amount_usd: settings?.purchase_amount || 0,
        btc_quantity: 0,
        btc_price: 0,
        status: 'failed',
        error_message: error.message || 'Unknown error'
      });
      
      logger.info('💾 Error record saved to database');
    }
  }

  private intervalToCron(intervalMinutes: number): string {
    console.log('🕒 Converting interval to cron:', intervalMinutes, 'minutes');
    
    if (intervalMinutes < 1) {
      // 秒単位のテスト用
      const seconds = Math.round(intervalMinutes * 60);
      console.log('⚡ Using seconds interval:', seconds);
      return `*/${seconds} * * * * *`; // 6桁cron (秒対応)
    } else if (intervalMinutes < 60) {
      const minutes = Math.round(intervalMinutes);
      console.log('⏱️ Using minutes interval:', minutes);
      return `*/${minutes} * * * *`;
    } else {
      const hours = Math.floor(intervalMinutes / 60);
      if (hours < 24) {
        console.log('🕐 Using hours interval:', hours);
        return `0 */${hours} * * *`;
      } else {
        const days = Math.floor(hours / 24);
        console.log('📅 Using days interval:', days);
        return `0 0 */${days} * *`;
      }
    }
  }

  private async getUserSettings(): Promise<UserSettings | null> {
    try {
      console.log('🔍 Querying database for user settings...');
      const db = DatabaseFactory.getConnection();
      const result = await db.get('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
      console.log('📋 Database query result:', result);
      return result as UserSettings || null;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  private async updateBotStatus(isActive: boolean): Promise<void> {
    try {
      const db = DatabaseFactory.getConnection();
      await db.run(
        'UPDATE user_settings SET is_bot_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT MAX(id) FROM user_settings)',
        [isActive]
      );
    } catch (error) {
      throw error;
    }
  }

  private async savePurchaseHistory(purchase: PurchaseHistory): Promise<void> {
    try {
      const db = DatabaseFactory.getConnection();
      await db.run(
        `INSERT INTO purchase_history 
         (purchase_date, amount_usd, btc_quantity, btc_price, order_id, status, error_message) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase.purchase_date,
          purchase.amount_usd,
          purchase.btc_quantity,
          purchase.btc_price,
          purchase.order_id,
          purchase.status,
          purchase.error_message
        ]
      );
    } catch (error) {
      throw error;
    }
  }
}

export const dcaEngine = new DCAEngine();