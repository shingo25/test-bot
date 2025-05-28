import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiKeyRequest {
  apiKey: string;
  apiSecret: string;
}

export interface SettingsRequest {
  purchase_amount: number;
  purchase_interval: number;
}

export interface Settings {
  purchase_amount: number | null;
  purchase_interval: number | null;
  is_bot_active: boolean;
}

export interface BotStatus {
  isRunning: boolean;
  nextExecution?: string;
  settings?: Settings;
}

export interface PurchaseHistory {
  id: number;
  purchase_date: string;
  amount_usd: number;
  btc_quantity: number;
  btc_price: number;
  order_id?: string;
  status: 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface Statistics {
  total_purchases: number;
  total_spent: number;
  total_btc: number;
  avg_price: number;
  successful_purchases: number;
  failed_purchases: number;
  success_rate: string;
}

// API Key Management
export const setApiKeys = async (data: ApiKeyRequest) => {
  const response = await api.post('/settings/apikey', data);
  return response.data;
};

export const testConnection = async () => {
  const response = await api.post('/test-connection');
  return response.data;
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data: SettingsRequest) => {
  const response = await api.put('/settings', data);
  return response.data;
};

// Bot Control
export const startBot = async () => {
  const response = await api.post('/bot/start');
  return response.data;
};

export const stopBot = async () => {
  const response = await api.post('/bot/stop');
  return response.data;
};

export const getBotStatus = async (): Promise<BotStatus> => {
  const response = await api.get('/bot/status');
  return response.data;
};

// History and Statistics
export const getPurchaseHistory = async (limit = 50, offset = 0): Promise<PurchaseHistory[]> => {
  const response = await api.get(`/history?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const getStatistics = async (): Promise<Statistics> => {
  const response = await api.get('/statistics');
  return response.data;
};

export default api;