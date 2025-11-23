const mongoose = require('mongoose');

// Обновленная схема адреса (UK)
const ShippingInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  
  // ❗️ ЗАМЕНИЛИ 'address' НА НОВЫЕ ПОЛЯ
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' }, // Не обязательно
  
  city: { type: String, required: true },
  postcode: { type: String, required: true },
  country: { type: String, required: true, default: 'United Kingdom' },
});

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  shippingInfo: ShippingInfoSchema,
  orderItems: [OrderItemSchema],
  stripePaymentIntentId: {
    type: String,
    required: true,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Оплачено', 'В работе', 'Отправлено', 'Доставлено', 'Отменено'],
    default: 'Оплачено',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);