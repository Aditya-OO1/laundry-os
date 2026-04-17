import { useEffect, useState } from 'react';
import { dashboard as dashApi } from '../api';

const STATUS_COLOR = { RECEIVED: 'teal', PROCESSING: 'amber', READY: 'blue', DELIVERED: 'green' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashApi.get()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <div className="page-error">{error}</div>;
  if (!data) return <div className="page-loading">Loading dashboard...</div>;

  const { totalOrders, totalRevenue, avgOrderValue, ordersByStatus, topGarments, recentOrders } = data;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="metric-grid">
        {[
          { label: 'Total orders', value: totalOrders },
          { label: 'Total revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
          { label: 'Avg order value', value: `₹${avgOrderValue}` },
          { label: 'Delivered', value: ordersByStatus.DELIVERED },
        ].map(m => (
          <div className="metric-card" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Orders by status</h3>
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <div className="status-bar-row" key={status}>
              <span className={`pill ${STATUS_COLOR[status]}`}>{status}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${STATUS_COLOR[status]}`}
                  style={{ width: totalOrders ? `${Math.round(count / totalOrders * 100)}%` : '0%' }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Top garments</h3>
          {topGarments.length === 0 && <p className="muted">No data yet</p>}
          {topGarments.map(g => (
            <div className="garment-row" key={g._id}>
              <span>{g._id}</span>
              <span className="muted">{g.count} pcs</span>
              <span className="green-text">₹{g.revenue}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Recent orders</h3>
        {recentOrders.length === 0 && <p className="muted">No orders yet</p>}
        <table className="table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o._id}>
                <td><code>{o.orderId}</code></td>
                <td>{o.customer.name}</td>
                <td><span className={`pill ${STATUS_COLOR[o.status]}`}>{o.status}</span></td>
                <td className="green-text">₹{o.totalAmount}</td>
                <td className="muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
