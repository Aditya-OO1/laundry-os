const express = require('express');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/orders  — list with filter + search
router.get('/', async (req, res, next) => {
  try {
    const { status, search, garment, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (garment) query['garments.name'] = { $regex: garment, $options: 'i' };
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('createdBy', 'name'),
      Order.countDocuments(query),
    ]);

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/orders  — create
router.post('/', async (req, res, next) => {
  try {
    const { customer, garments, estimatedDeliveryDays = 2 } = req.body;
    if (!customer?.name || !customer?.phone)
      return res.status(400).json({ error: 'customer.name and customer.phone required' });
    if (!garments?.length)
      return res.status(400).json({ error: 'At least one garment required' });

    const PRICES = Order.GARMENT_PRICES;
    let totalAmount = 0;
    const processedGarments = garments.map((g) => {
      const price = PRICES[g.name];
      if (!price) throw Object.assign(new Error(`Unknown garment: ${g.name}`), { status: 400 });
      if (!g.qty || g.qty < 1) throw Object.assign(new Error(`Invalid qty for ${g.name}`), { status: 400 });
      const subtotal = price * g.qty;
      totalAmount += subtotal;
      return { name: g.name, qty: g.qty, pricePerPiece: price, subtotal };
    });

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Number(estimatedDeliveryDays));

    const order = await Order.create({
      customer, garments: processedGarments, totalAmount,
      estimatedDelivery, createdBy: req.user._id,
    });

    res.status(201).json({ order });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { orderId: req.params.id }]
    }).populate('createdBy', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
    if (!valid.includes(status))
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });

    const order = await Order.findOneAndUpdate(
      { $or: [{ orderId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }] },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) { next(err); }
});

// DELETE /api/orders/:id  (admin only — soft approach: mark delivered)
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) { next(err); }
});

// GET /api/orders/meta/garments  — list all garment types + prices
router.get('/meta/garments', (req, res) => {
  res.json({ garments: Order.GARMENT_PRICES });
});

module.exports = router;
