const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { deleteFile } = require('../utils/fileStorage');

const getAllUsers = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const deleteUser = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const getOrders = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const getSingleOrder = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const updateOrderToPaid = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const updateOrderToDelivered = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const deleteOrder = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const getAllProducts = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const getSingleProduct = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const createProduct = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const updateProduct = (req, res) => res.status(501).json({ message: 'Not Implemented' });
const deleteProduct = (req, res) => res.status(501).json({ message: 'Not Implemented' });

const getDateAYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

const getStartOfCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getSalesAnalytics = asyncHandler(async (req, res) => {
  const oneYearAgo = getDateAYearAgo();
  const startOfMonth = getStartOfCurrentMonth();

  const overallSummary = await Order.aggregate([
    { $match: { status: 'Paid' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } },
      },
    },
    { $project: { _id: 0, totalRevenue: 1, totalOrders: 1, avgOrderValue: 1 } },
  ]);

  const monthlyData = await Order.aggregate([
    { $match: { status: 'Paid', createdAt: { $gte: oneYearAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalRevenue: { $sum: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        totalRevenue: 1,
        totalOrders: 1,
      },
    },
  ]);

  const topProductsAllTime = await Order.aggregate([
    { $match: { status: 'Paid' } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: { name: '$orderItems.name', size: '$orderItems.size' },
        totalSold: { $sum: '$orderItems.quantity' },
        totalMlSold: { $sum: { $multiply: ['$orderItems.size', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  const topProductsThisMonth = await Order.aggregate([
    { $match: { status: 'Paid', createdAt: { $gte: startOfMonth } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: { name: '$orderItems.name', size: '$orderItems.size' },
        totalSold: { $sum: '$orderItems.quantity' },
        totalMlSold: { $sum: { $multiply: ['$orderItems.size', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    summary: overallSummary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
    monthlySales: monthlyData,
    topProductsAllTime,
    topProductsThisMonth,
  });
});

module.exports = {
  getAllUsers,
  deleteUser,
  getOrders,
  getSingleOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  deleteOrder,
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSalesAnalytics, 
};