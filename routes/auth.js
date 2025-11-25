const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
});

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
  category: {
    type: String,
    required: true,
    enum: ['Fresh', 'Woody', 'Floral', 'Oriental', 'Fruity', 'Spicy'],
    default: 'Fresh'
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Unisex'],
    default: 'Unisex'
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
  similarProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
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