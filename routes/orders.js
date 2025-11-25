const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');
const { sendOrderStatusEmail } = require('../utils/sendEmail');

router.use(verifyToken);

router.get('/', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/myorders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    if (sendOrderStatusEmail) {
        sendOrderStatusEmail(order).catch(err => console.error('Email error:', err));
    }

    res.status(200).json(order);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update error' });
  }
});

module.exports = router;