import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orders as ordersApi } from '../api';

const STATUSES = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
const STATUS_COLOR = { RECEIVED: 'teal', PROCESSING: 'amber', READY: 'blue', DELIVERED: 'green' };

export default function Orders() {
  const [data, setData] = useState({ orders: [], total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', garment: '' });
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    ordersApi.list({ ...filters })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      toast.success(`Status updated to ${status}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const set = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Orders <span className="count-badge">{data.total}</span></h1>
        <Link to="/orders/new" className="btn-primary">+ New order</Link>
      </div>

      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search by name, phone, order ID..."
          value={filters.search}
          onChange={set('search')}
        />
        <input
          className="filter-input small"
          placeholder="Garment type..."
          value={filters.garment}
          onChange={set('garment')}
        />
        <select className="filter-select" value={filters.status} onChange={set('status')}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <div className="page-loading">Loading orders...</div>}

      {!loading && data.orders.length === 0 && (
        <div className="empty-state">
          <p>No orders found.</p>
          <Link to="/orders/new" className="btn-primary">Create your first order</Link>
        </div>
      )}

      {!loading && data.orders.map(order => (
        <div className="order-card" key={order._id}>
          <div className="order-top">
            <div>
              <code className="order-id">{order.orderId}</code>
              <div className="order-name">{order.customer.name}</div>
              <div className="muted small">{order.customer.phone}</div>
            </div>
            <div className="order-right">
              <select
                className={`status-select ${STATUS_COLOR[order.status]}`}
                value={order.status}
                onChange={e => handleStatusChange(order.orderId, e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="order-total">₹{order.totalAmount}</div>
            </div>
          </div>
          <div className="garment-chips">
            {order.garments.map(g => (
              <span className="chip" key={g.name}>{g.name} ×{g.qty} — ₹{g.subtotal}</span>
            ))}
          </div>
          <div className="order-footer-row">
            <span className="muted small">Placed {formatDate(order.createdAt)}</span>
            <span className="muted small">Est. delivery: {formatDate(order.estimatedDelivery)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
