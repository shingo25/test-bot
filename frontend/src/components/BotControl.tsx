import React, { useState, useEffect } from 'react';
import { startBot, stopBot, getBotStatus, BotStatus } from '../api/api';

interface BotControlProps {
  onStatusChange: () => void;
}

const BotControl: React.FC<BotControlProps> = ({ onStatusChange }) => {
  const [botStatus, setBotStatus] = useState<BotStatus>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBotStatus = async () => {
    try {
      const status = await getBotStatus();
      setBotStatus(status);
    } catch (err: any) {
      console.error('Failed to fetch bot status:', err);
    }
  };

  const handleStartBot = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await startBot();
      setSuccess(result.message);
      await fetchBotStatus();
      onStatusChange();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to start bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await stopBot();
      setSuccess(result.message);
      await fetchBotStatus();
      onStatusChange();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to stop bot');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNextExecution = (nextExecution?: string) => {
    if (!nextExecution) return 'N/A';
    
    const date = new Date(nextExecution);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Very soon';
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours < 24) {
      return remainingMinutes > 0 
        ? `${diffHours}h ${remainingMinutes}m`
        : `${diffHours} hours`;
    }
    
    return date.toLocaleString();
  };

  const canStartBot = () => {
    return botStatus.settings?.purchase_amount && 
           botStatus.settings?.purchase_interval && 
           !botStatus.isRunning;
  };

  return (
    <div className="bot-control">
      <h2>Bot Control</h2>
      
      <div className="status-panel">
        <div className="status-indicator">
          <span className={`status-dot ${botStatus.isRunning ? 'running' : 'stopped'}`}></span>
          <span className="status-text">
            {botStatus.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>

        {botStatus.isRunning && (
          <div className="next-execution">
            <span>Next purchase: {formatNextExecution(botStatus.nextExecution)}</span>
          </div>
        )}
      </div>

      <div className="control-buttons">
        {!botStatus.isRunning ? (
          <button
            onClick={handleStartBot}
            disabled={isLoading || !canStartBot()}
            className={`start-button ${canStartBot() ? 'enabled' : 'disabled'}`}
          >
            {isLoading ? 'Starting...' : 'Start Bot'}
          </button>
        ) : (
          <button
            onClick={handleStopBot}
            disabled={isLoading}
            className="stop-button"
          >
            {isLoading ? 'Stopping...' : 'Stop Bot'}
          </button>
        )}
      </div>

      {!canStartBot() && !botStatus.isRunning && (
        <div className="requirements-notice">
          <h3>⚠️ Requirements</h3>
          <p>Please configure the following before starting the bot:</p>
          <ul>
            {!botStatus.settings?.purchase_amount && <li>Purchase amount</li>}
            {!botStatus.settings?.purchase_interval && <li>Purchase interval</li>}
          </ul>
        </div>
      )}

      {botStatus.settings && (
        <div className="current-settings">
          <h3>Current Settings</h3>
          <div className="setting-item">
            <span>Purchase Amount:</span>
            <span>{botStatus.settings.purchase_amount || 'Not set'} USDT</span>
          </div>
          <div className="setting-item">
            <span>Purchase Interval:</span>
            <span>
              {botStatus.settings.purchase_interval 
                ? `${botStatus.settings.purchase_interval} minutes`
                : 'Not set'
              }
            </span>
          </div>
        </div>
      )}

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

      {botStatus.isRunning && (
        <div className="running-notice">
          <h3>🤖 Bot is Active</h3>
          <p>The DCA bot is running and will automatically purchase Bitcoin according to your settings.</p>
          <p>You can safely close this page - the bot will continue running on the server.</p>
        </div>
      )}
    </div>
  );
};

export default BotControl;