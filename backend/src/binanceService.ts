import Binance from 'binance-api-node';
import { EncryptionService } from './encryption';

export class BinanceService {
  private client: any;
  private isTestMode: boolean;

  constructor(apiKey?: string, apiSecret?: string, testMode = true) {
    this.isTestMode = testMode;
    
    if (apiKey && apiSecret) {
      this.initializeClient(apiKey, apiSecret);
    }
  }

  private initializeClient(apiKey: string, apiSecret: string): void {
    try {
      const config: any = {
        apiKey: apiKey,
        apiSecret: apiSecret
      };
      
      if (this.isTestMode) {
        config.httpBase = 'https://testnet.binance.vision';
        config.wsBase = 'wss://testnet.binance.vision/ws';
      }
      
      this.client = Binance(config);
    } catch (error) {
      console.error('Error initializing Binance client:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<{ success: boolean; balance?: any; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      const accountInfo = await this.client.accountInfo();
      const usdtBalance = accountInfo.balances.find((balance: any) => balance.asset === 'USDT');
      
      return {
        success: true,
        balance: {
          usdt: parseFloat(usdtBalance?.free || '0'),
          total_assets: accountInfo.balances.length
        }
      };
    } catch (error: any) {
      console.error('Binance connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  public async getCurrentBTCPrice(): Promise<number> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const ticker = await this.client.prices({ symbol: 'BTCUSDT' });
      return parseFloat(ticker.BTCUSDT);
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      throw error;
    }
  }

  public async purchaseBTC(amountUSDT: number): Promise<{
    success: boolean;
    orderId?: string;
    quantity?: number;
    price?: number;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      const currentPrice = await this.getCurrentBTCPrice();
      const quantity = (amountUSDT / currentPrice).toFixed(6);

      const minNotional = 10; // Binance minimum for BTCUSDT
      if (amountUSDT < minNotional) {
        return {
          success: false,
          error: `Order amount ${amountUSDT} USDT is below minimum ${minNotional} USDT`
        };
      }

      const order = await this.client.order({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: amountUSDT.toFixed(2)
      });

      return {
        success: true,
        orderId: order.orderId.toString(),
        quantity: parseFloat(quantity),
        price: currentPrice
      };
    } catch (error: any) {
      console.error('Error purchasing BTC:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed'
      };
    }
  }

  public async getAccountBalance(): Promise<{ usdt: number; btc: number }> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const accountInfo = await this.client.accountInfo();
      const usdtBalance = accountInfo.balances.find((balance: any) => balance.asset === 'USDT');
      const btcBalance = accountInfo.balances.find((balance: any) => balance.asset === 'BTC');

      return {
        usdt: parseFloat(usdtBalance?.free || '0'),
        btc: parseFloat(btcBalance?.free || '0')
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      throw error;
    }
  }

  public setTestMode(testMode: boolean): void {
    this.isTestMode = testMode;
  }
}