const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');
const { sendOrderStatusEmail } = require('../utils/sendEmail');

// Защищаем все роуты токеном
router.use(verifyToken);

// 1. ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ (Только Админ) - это для страницы "Заказы"
router.get('/', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 2. ПОЛУЧИТЬ "МОИ" ЗАКАЗЫ (Для Личного кабинета)
router.get('/myorders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 3. ОБНОВИТЬ СТАТУС ЗАКАЗА (Только Админ)
router.patch('/:id/status', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    order.status = status;
    await order.save();

    // Отправляем письмо клиенту о смене статуса
    if (sendOrderStatusEmail) {
       sendOrderStatusEmail(order).catch(err => console.error('Email error:', err));
    }
    
    res.status(200).json(order);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления' });
  }
});

module.exports = router;