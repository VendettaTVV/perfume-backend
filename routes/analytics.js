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
  getSalesAnalytics, 
} = require('../controllers/adminController');

const router = express.Router();

// Apply middleware to all routes in this file
router.use(checkAuth);
router.use(adminAuth);

// Analytics
router.get('/analytics', getSalesAnalytics); 

// User Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Order Management
router.get('/orders', getOrders);
router.get('/orders/:id', getSingleOrder);
router.put('/orders/:id/pay', updateOrderToPaid);
router.put('/orders/:id/deliver', updateOrderToDelivered);
router.delete('/orders/:id', deleteOrder);

// Product Management
router.get('/products', getAllProducts);
router.get('/products/:id', getSingleProduct);
// Use middleware for image uploads
router.post('/products', uploadMiddleware.single('image'), createProduct);
router.put('/products/:id', uploadMiddleware.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;