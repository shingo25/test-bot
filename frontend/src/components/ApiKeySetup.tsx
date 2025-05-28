import React, { useState } from 'react';
import { setApiKeys, testConnection } from '../api/api';

interface ApiKeySetupProps {
  onSuccess: () => void;
}

interface ConnectionResult {
  success: boolean;
  balance?: {
    usdt: number;
    total_assets: number;
  };
  error?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setConnectionResult(null);

    try {
      console.log('🔄 Saving API keys...');
      const result = await setApiKeys({ apiKey, apiSecret });
      console.log('✅ API keys saved successfully:', result);
      
      setApiKey('');
      setApiSecret('');
      onSuccess();
    } catch (err: any) {
      console.error('❌ Failed to save API keys:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey || !apiSecret) {
      setError('Please enter both API key and secret');
      return;
    }

    setIsTestingConnection(true);
    setError('');
    setConnectionResult(null);

    try {
      console.log('🔄 Testing connection...');
      
      // First save the keys temporarily
      console.log('💾 Saving keys for testing...');
      await setApiKeys({ apiKey, apiSecret });
      
      // Then test the connection
      console.log('🌐 Testing Binance connection...');
      const result = await testConnection();
      console.log('📊 Connection result:', result);
      
      setConnectionResult(result);
    } catch (err: any) {
      console.error('❌ Connection test failed:', err);
      setError(err.response?.data?.error || err.message || 'Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="api-key-setup">
      <h2>Binance API Setup</h2>
      <p>Enter your Binance API credentials. Make sure to use testnet keys for testing.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="apiKey">API Key:</label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Binance API key"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiSecret">API Secret:</label>
          <input
            type="password"
            id="apiSecret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your Binance API secret"
            required
          />
        </div>

        <div className="button-group">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection || !apiKey || !apiSecret}
            className="test-button"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="save-button"
          >
            {isLoading ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      </form>

      {connectionResult && (
        <div className={`connection-result ${connectionResult.success ? 'success' : 'error'}`}>
          {connectionResult.success ? (
            <div>
              <h3>✅ Connection Successful!</h3>
              <p>USDT Balance: {connectionResult.balance?.usdt || 0}</p>
              <p>Total Assets: {connectionResult.balance?.total_assets || 0}</p>
            </div>
          ) : (
            <div>
              <h3>❌ Connection Failed</h3>
              <p>{connectionResult.error}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="security-notice">
        <h3>🔒 Security Notice</h3>
        <ul>
          <li>API keys are encrypted before storage</li>
          <li>Use testnet keys for testing</li>
          <li>Ensure API keys have only spot trading permissions</li>
          <li>Never share your API keys with anyone</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiKeySetup;