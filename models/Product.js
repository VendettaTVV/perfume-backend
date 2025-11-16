// models/Product.js
const mongoose = require('mongoose');

// Схема для Варианта (5ml, 10ml и т.д.)
// ❗️ Убираем отсюда stock, так как запас общий
const VariantSchema = new mongoose.Schema({
  size: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String, 
    required: true,
  },
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  baseDescription: {
    type: String,
    required: true,
  },
  bgColor: {
    type: String,
    default: '#D4CFCB',
  },
  // ❗️ НОВОЕ ПОЛЕ: Общий запас парфюма в миллилитрах
  totalStockMl: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  
  variants: [VariantSchema], 
  
  isHidden: {
    type: Boolean,
    default: false,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);