import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orders as ordersApi } from '../api';

export default function NewOrder() {
  const navigate = useNavigate();
  const [garmentPrices, setGarmentPrices] = useState({});
  const [quantities, setQuantities] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', deliveryDays: 2 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ordersApi.garments().then(r => {
      setGarmentPrices(r.data.garments);
      const init = {};
      Object.keys(r.data.garments).forEach(g => { init[g] = 0; });
      setQuantities(init);
    });
  }, []);

  const changeQty = (g, delta) => {
    setQuantities(q => ({ ...q, [g]: Math.max(0, (q[g] || 0) + delta) }));
  };

  const total = Object.entries(quantities).reduce((s, [g, qty]) => s + qty * (garmentPrices[g] || 0), 0);
  const hasItems = total > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasItems) { toast.error('Add at least one garment'); return; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error('Enter a valid 10-digit phone number'); return; }

    const garments = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([name, qty]) => ({ name, qty }));

    setLoading(true);
    try {
      const res = await ordersApi.create({
        customer: { name: form.name, phone: form.phone },
        garments,
        estimatedDeliveryDays: form.deliveryDays,
      });
      toast.success(`Order ${res.data.order.orderId} created!`);
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const estDate = new Date();
  estDate.setDate(estDate.getDate() + Number(form.deliveryDays));
  const estStr = estDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <h1 className="page-title">New order</h1>
      <form onSubmit={handleSubmit} className="order-form">
        <div className="card">
          <h3>Customer details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Customer name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Phone number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="10-digit mobile" maxLength={10} />
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>Delivery in (days)</label>
            <input type="number" min={1} max={14} value={form.deliveryDays} onChange={e => setForm(f => ({ ...f, deliveryDays: e.target.value }))} />
          </div>
          <p className="muted small">Estimated delivery: <strong>{estStr}</strong></p>
        </div>

        <div className="card">
          <h3>Select garments</h3>
          <table className="garment-table">
            <thead><tr><th>Garment</th><th>Price/pc</th><th>Qty</th><th>Subtotal</th></tr></thead>
            <tbody>
              {Object.entries(garmentPrices).map(([g, price]) => {
                const qty = quantities[g] || 0;
                return (
                  <tr key={g}>
                    <td>{g}</td>
                    <td className="muted">₹{price}</td>
                    <td>
                      <div className="qty-ctrl">
                        <button type="button" onClick={() => changeQty(g, -1)}>−</button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => changeQty(g, 1)}>+</button>
                      </div>
                    </td>
                    <td className={qty > 0 ? 'green-text' : 'muted'}>{qty > 0 ? `₹${qty * price}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="total-bar">
          <div>
            <div className="muted small">Total amount</div>
            <div className="total-amount">₹{total}</div>
          </div>
          <button type="submit" className="btn-primary large" disabled={!hasItems || loading}>
            {loading ? 'Creating...' : 'Create order →'}
          </button>
        </div>
      </form>
    </div>
  );
}
