import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, Settings } from '../api/api';

interface DCASettingsProps {
  onSettingsUpdate: () => void;
}

const DCASettings: React.FC<DCASettingsProps> = ({ onSettingsUpdate }) => {
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseInterval, setPurchaseInterval] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const intervalOptions = [
    { value: 0.5, label: '30 seconds (TEST ONLY)' },
    { value: 1, label: '1 minute (TEST ONLY)' },
    { value: 2, label: '2 minutes (TEST ONLY)' },
    { value: 5, label: '5 minutes (TEST ONLY)' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 240, label: '4 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsFetching(true);
      const settings = await getSettings();
      
      if (settings.purchase_amount) {
        setPurchaseAmount(settings.purchase_amount.toString());
      }
      if (settings.purchase_interval) {
        setPurchaseInterval(settings.purchase_interval.toString());
      }
    } catch (err: any) {
      setError('Failed to load settings');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const amount = parseFloat(purchaseAmount);
    const interval = parseFloat(purchaseInterval); // parseFloat instead of parseInt for decimal values

    console.log('📝 Submitting settings:', { amount, interval, purchaseAmount, purchaseInterval });

    if (amount < 10) {
      setError('Minimum purchase amount is 10 USDT (Binance requirement)');
      setIsLoading(false);
      return;
    }

    if (!interval || interval <= 0) {
      setError('Please select a valid purchase interval');
      setIsLoading(false);
      return;
    }

    try {
      await updateSettings({
        purchase_amount: amount,
        purchase_interval: interval
      });
      setSuccess('Settings updated successfully!');
      onSettingsUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Settings update error:', err);
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlySpend = () => {
    if (!purchaseAmount || !purchaseInterval) return 0;
    
    const amount = parseFloat(purchaseAmount);
    const interval = parseInt(purchaseInterval);
    
    const purchasesPerDay = (24 * 60) / interval;
    const monthlySpend = amount * purchasesPerDay * 30;
    
    return monthlySpend.toFixed(2);
  };

  const getSelectedIntervalLabel = () => {
    const selected = intervalOptions.find(option => option.value.toString() === purchaseInterval);
    return selected ? selected.label : '';
  };

  if (isFetching) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="dca-settings">
      <h2>DCA Settings</h2>
      <p>Configure your Dollar Cost Averaging strategy for Bitcoin purchases.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="purchaseAmount">Purchase Amount (USDT):</label>
          <input
            type="number"
            id="purchaseAmount"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            placeholder="Enter amount in USDT"
            min="10"
            step="0.01"
            required
          />
          <small className="help-text">Minimum: 10 USDT (Binance requirement)</small>
        </div>

        <div className="form-group">
          <label htmlFor="purchaseInterval">Purchase Interval:</label>
          <select
            id="purchaseInterval"
            value={purchaseInterval}
            onChange={(e) => setPurchaseInterval(e.target.value)}
            required
          >
            <option value="">Select interval</option>
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {purchaseAmount && purchaseInterval && (
          <div className="strategy-summary">
            <h3>Strategy Summary</h3>
            <div className="summary-item">
              <span>Purchase Amount:</span>
              <span>{purchaseAmount} USDT</span>
            </div>
            <div className="summary-item">
              <span>Frequency:</span>
              <span>Every {getSelectedIntervalLabel()}</span>
            </div>
            <div className="summary-item">
              <span>Estimated Monthly Spend:</span>
              <span>{calculateMonthlySpend()} USDT</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="save-button"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {success && (
        <div className="success-message">
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="dca-info">
        <h3>💡 DCA Strategy Benefits</h3>
        <ul>
          <li>Reduces the impact of volatility through regular purchases</li>
          <li>Removes the need to time the market</li>
          <li>Builds discipline in long-term investing</li>
          <li>Potential to lower average cost basis over time</li>
        </ul>
      </div>
    </div>
  );
};

export default DCASettings;