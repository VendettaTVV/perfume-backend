const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { deleteFile } = require('../utils/fileStorage');

// --- ЗАГЛУШКИ ДЛЯ ФУНКЦИЙ (Чтобы сервер не падал) ---
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

// ====================================================================
// ЛОГИКА АНАЛИТИКИ
// ====================================================================

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

  // 1. Общая сводка (за все время)
  const overallSummary = await Order.aggregate([
    { $match: { status: 'Оплачено' } },
    {
      $group: {
        _id: null,
        // Вычитаем доставку. Если shippingPrice нет (старые заказы), считаем 0.
        totalRevenue: { 
          $sum: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } 
        },
        totalOrders: { $sum: 1 },
        avgOrderValue: { 
          $avg: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } 
        },
      },
    },
    { $project: { _id: 0, totalRevenue: 1, totalOrders: 1, avgOrderValue: 1 } },
  ]);

  // 2. Помесячные данные (за последний год)
  const monthlyData = await Order.aggregate([
    { $match: { status: 'Оплачено', createdAt: { $gte: oneYearAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        // Вычитаем доставку
        totalRevenue: { 
          $sum: { $subtract: ['$totalPrice', { $ifNull: ['$shippingPrice', 0] }] } 
        },
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

  // 3. Топ товаров за ВСЕ ВРЕМЯ
  const topProductsAllTime = await Order.aggregate([
    { $match: { status: 'Оплачено' } },
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

  // 4. Топ товаров за ТЕКУЩИЙ МЕСЯЦ
  const topProductsThisMonth = await Order.aggregate([
    { $match: { status: 'Оплачено', createdAt: { $gte: startOfMonth } } },
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
    summary: overallSummary[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
    },
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