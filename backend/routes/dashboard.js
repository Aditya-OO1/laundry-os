const express = require('express');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const [statusAgg, revenueAgg, recentOrders, garmentAgg] = await Promise.all([
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).select('orderId customer status totalAmount createdAt'),
      Order.aggregate([
        { $unwind: '$garments' },
        { $group: { _id: '$garments.name', count: { $sum: '$garments.qty' }, revenue: { $sum: '$garments.subtotal' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const statusMap = { RECEIVED: 0, PROCESSING: 0, READY: 0, DELIVERED: 0 };
    statusAgg.forEach(({ _id, count }) => { statusMap[_id] = count; });

    const totalOrders = revenueAgg[0]?.count || 0;
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      ordersByStatus: statusMap,
      topGarments: garmentAgg,
      recentOrders,
    });
  } catch (err) { next(err); }
});

module.exports = router;
