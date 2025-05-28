import React, { useState, useEffect, useCallback } from 'react';
import { getPurchaseHistory, getStatistics, PurchaseHistory as PurchaseHistoryType, Statistics } from '../api/api';

const PurchaseHistory: React.FC = () => {
  const [history, setHistory] = useState<PurchaseHistoryType[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      
      const [historyData, statsData] = await Promise.all([
        getPurchaseHistory(itemsPerPage, offset),
        getStatistics()
      ]);
      
      setHistory(historyData);
      setStatistics(statsData);
    } catch (err: any) {
      setError('Failed to load purchase history');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchData();
    
    // 自動更新タイマー（30秒ごと）
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = ['Date', 'Amount (USDT)', 'BTC Quantity', 'BTC Price', 'Status', 'Order ID', 'Error'];
    const csvContent = [
      headers.join(','),
      ...history.map(item => [
        formatDate(item.purchase_date),
        item.amount_usd,
        item.btc_quantity,
        item.btc_price,
        item.status,
        item.order_id || '',
        item.error_message || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dca-purchase-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="loading">Loading purchase history...</div>;
  }

  return (
    <div className="purchase-history">
      <div className="history-header">
        <h2>Purchase History & Statistics</h2>
        {history.length > 0 && (
          <button onClick={exportToCSV} className="export-button">
            📄 Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {statistics && (
        <div className="statistics-panel">
          <h3>📊 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Purchases:</span>
              <span className="stat-value">{statistics.total_purchases}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Spent:</span>
              <span className="stat-value">{formatNumber(statistics.total_spent)} USDT</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total BTC Acquired:</span>
              <span className="stat-value">{formatNumber(statistics.total_btc, 6)} BTC</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Purchase Price:</span>
              <span className="stat-value">${formatNumber(statistics.avg_price)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">{statistics.success_rate}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Failed Purchases:</span>
              <span className="stat-value">{statistics.failed_purchases}</span>
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="no-history">
          <h3>No Purchase History</h3>
          <p>No purchases have been made yet. Start the DCA bot to begin automated Bitcoin purchases.</p>
        </div>
      ) : (
        <>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount (USDT)</th>
                  <th>BTC Quantity</th>
                  <th>BTC Price</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className={`status-${item.status}`}>
                    <td>{formatDate(item.purchase_date)}</td>
                    <td>{formatNumber(item.amount_usd)}</td>
                    <td>{formatNumber(item.btc_quantity, 6)}</td>
                    <td>${formatNumber(item.btc_price)}</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'success' ? '✅' : '❌'} {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === 'success' ? (
                        <span className="order-id">Order: {item.order_id}</span>
                      ) : (
                        <span className="error-detail" title={item.error_message}>
                          {item.error_message?.substring(0, 50)}
                          {item.error_message && item.error_message.length > 50 ? '...' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={history.length < itemsPerPage}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}

      <div className="refresh-section">
        <button onClick={fetchData} className="refresh-button">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default PurchaseHistory;