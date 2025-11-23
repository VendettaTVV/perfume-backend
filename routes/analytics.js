const express = require('express');
const {
  adminAuth,
  uploadMiddleware,
  checkAuth,
} = require('../middleware/authMiddleware');
const {
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
  getSalesAnalytics, // <-- ДОБАВЛЕНО
} = require('../controllers/adminController');

const router = express.Router();

// Middleware для всех роутов в этом файле
router.use(checkAuth);
router.use(adminAuth);

// Аналитика
router.get('/analytics', getSalesAnalytics); // <-- НОВЫЙ РОУТ

// Управление пользователями
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Управление заказами
router.get('/orders', getOrders);
router.get('/orders/:id', getSingleOrder);
router.put('/orders/:id/pay', updateOrderToPaid);
router.put('/orders/:id/deliver', updateOrderToDelivered);
router.delete('/orders/:id', deleteOrder);

// Управление продуктами
router.get('/products', getAllProducts);
router.get('/products/:id', getSingleProduct);
// Используем middleware для загрузки изображений
router.post('/products', uploadMiddleware.single('image'), createProduct);
router.put('/products/:id', uploadMiddleware.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;