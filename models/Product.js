const mongoose = require('mongoose');

// Схема отдельного отзыва
const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true }, // Оценка 1-5
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Ссылка на пользователя
  },
}, {
  timestamps: true,
});

// Схема Варианта (5ml, 10ml...)
const VariantSchema = new mongoose.Schema({
  size: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
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
  
  // НОВЫЕ ПОЛЯ ДЛЯ ОТЗЫВОВ
  reviews: [reviewSchema],
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);