import React, { useState, useEffect } from 'react';
import './App.css';
import ApiKeySetup from './components/ApiKeySetup';
import DCASettings from './components/DCASettings';
import BotControl from './components/BotControl';
import PurchaseHistory from './components/PurchaseHistory';
import { getSettings, getBotStatus, testConnection } from './api/api';

interface AppState {
  hasApiKeys: boolean;
  hasSettings: boolean;
  currentTab: 'setup' | 'settings' | 'control' | 'history';
  isLoading: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    hasApiKeys: false,
    hasSettings: false,
    currentTab: 'setup',
    isLoading: true
  });
  const [botRunning, setBotRunning] = useState(false);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      console.log('🔄 Checking initial state...');
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [settings, botStatus] = await Promise.all([
        getSettings(),
        getBotStatus()
      ]);

      console.log('📊 Settings:', settings);
      console.log('🤖 Bot Status:', botStatus);

      const hasSettings = !!(settings.purchase_amount && settings.purchase_interval);
      // Check if we can connect to verify API keys are set
      let hasApiKeys = false;
      try {
        await testConnection();
        hasApiKeys = true;
        console.log('✅ API keys are configured and working');
      } catch (error) {
        console.log('⚠️ API keys not configured or not working');
        hasApiKeys = false;
      }

      setBotRunning(botStatus.isRunning);

      setState({
        hasApiKeys,
        hasSettings,
        currentTab: hasApiKeys ? (hasSettings ? 'control' : 'settings') : 'setup',
        isLoading: false
      });
      
      console.log('✅ Initial state loaded successfully');
    } catch (error) {
      console.error('❌ Error checking initial state:', error);
      setState(prev => ({ 
        ...prev, 
        hasApiKeys: false, 
        hasSettings: false,
        currentTab: 'setup',
        isLoading: false 
      }));
    }
  };

  const handleApiKeySuccess = () => {
    setState(prev => ({ 
      ...prev, 
      hasApiKeys: true,
      currentTab: prev.hasSettings ? 'control' : 'settings'
    }));
  };

  const handleSettingsUpdate = () => {
    setState(prev => ({ 
      ...prev, 
      hasSettings: true,
      currentTab: 'control'
    }));
  };

  const handleBotStatusChange = async () => {
    try {
      const status = await getBotStatus();
      setBotRunning(status.isRunning);
    } catch (error) {
      console.error('Error updating bot status:', error);
    }
  };


  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  if (state.isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <h1>🤖 Binance DCA Bot</h1>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Binance DCA Bot</h1>
        <div className="status-indicator">
          <span className={`status-dot ${botRunning ? 'running' : 'stopped'}`}></span>
          <span>{botRunning ? 'Bot Running' : 'Bot Stopped'}</span>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${state.currentTab === 'setup' ? 'active' : ''} ${!state.hasApiKeys ? 'required' : ''}`}
          onClick={() => setState(prev => ({ ...prev, currentTab: 'setup' }))}
        >
          🔑 API Setup {!state.hasApiKeys && <span className="required-badge">!</span>}
        </button>
        
        <button
          className={`nav-button ${state.currentTab === 'settings' ? 'active' : ''} ${!state.hasSettings ? 'required' : ''}`}
          onClick={() => setState(prev => ({ ...prev, currentTab: 'settings' }))}
          disabled={!state.hasApiKeys}
        >
          ⚙️ DCA Settings {!state.hasSettings && state.hasApiKeys && <span className="required-badge">!</span>}
        </button>
        
        <button
          className={`nav-button ${state.currentTab === 'control' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, currentTab: 'control' }))}
          disabled={!state.hasApiKeys || !state.hasSettings}
        >
          🎮 Bot Control
        </button>
        
        <button
          className={`nav-button ${state.currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, currentTab: 'history' }))}
        >
          📈 History
        </button>
      </nav>

      <main className="app-main">
        {state.currentTab === 'setup' && (
          <ApiKeySetup onSuccess={handleApiKeySuccess} />
        )}
        
        {state.currentTab === 'settings' && state.hasApiKeys && (
          <DCASettings onSettingsUpdate={handleSettingsUpdate} />
        )}
        
        {state.currentTab === 'control' && state.hasApiKeys && state.hasSettings && (
          <BotControl onStatusChange={handleBotStatusChange} />
        )}
        
        {state.currentTab === 'history' && (
          <PurchaseHistory />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="phase-indicator">
            <span>📍 Phase 1: Local Development & Testing</span>
          </div>
          <div className="notification-setup">
            <button onClick={requestNotificationPermission} className="notification-button">
              🔔 Enable Notifications
            </button>
          </div>
          <div className="security-notice">
            <span>🔒 All data stored locally & encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
