const mongoose = require('mongoose');

const GARMENT_PRICES = {
  Shirt: 40, Pants: 60, Saree: 120, Suit: 200,
  Jacket: 150, Dress: 100, 'T-Shirt': 30, Jeans: 70,
  Kurta: 50, Blanket: 180,
};

const garmentSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: Object.keys(GARMENT_PRICES) },
  qty: { type: Number, required: true, min: 1 },
  pricePerPiece: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
  },
  garments: { type: [garmentSchema], required: true, validate: v => v.length > 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
    default: 'RECEIVED',
  },
  estimatedDelivery: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate orderId before saving
orderSchema.pre('save', async function (next) {
  if (this.orderId) return next();
  const count = await mongoose.model('Order').countDocuments();
  this.orderId = 'ORD-' + String(count + 1).padStart(4, '0');
  next();
});

orderSchema.statics.GARMENT_PRICES = GARMENT_PRICES;

module.exports = mongoose.model('Order', orderSchema);
