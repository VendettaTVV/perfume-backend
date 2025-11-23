const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const verifyToken = require('../middleware/verifyToken');

// 1. СОЗДАТЬ КУПОН (Только Админ)
// Пример тела запроса: { "code": "SUMMER10", "discountPercent": 10, "expiryDate": "2025-12-31" }
router.post('/', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Доступ запрещен' });
  
  try {
    const { code, discountPercent, expiryDate } = req.body;
    
    const newCoupon = new Coupon({
      code,
      discountPercent,
      expiryDate,
    });
    
    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (err) {
    console.error(err); // Логируем ошибку в консоль
    res.status(500).json({ message: 'Ошибка создания купона' });
  }
});

// 2. ПРОВЕРИТЬ КУПОН (Публичный роут)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Ищем купон (игнорируя регистр, если сохраняли uppercase)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Купон не найден' });
    }
    
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Купон неактивен' });
    }
    
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'Срок действия купона истек' });
    }
    
    // Если все ок, возвращаем данные
    res.status(200).json({ 
      isValid: true, 
      discountPercent: coupon.discountPercent,
      code: coupon.code 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка проверки' });
  }
});

module.exports = router;