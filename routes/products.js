const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order'); // Нужно для проверки покупки
const verifyToken = require('../middleware/verifyToken');

// --- 1. ПОЛУЧИТЬ ВСЕ ПУБЛИЧНЫЕ ТОВАРЫ ---
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isHidden: false }); 
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- 2. ПОЛУЧИТЬ ВСЕ ТОВАРЫ (Админ) ---
router.get('/all', verifyToken, async (req, res) => {
  try {
    const products = await Product.find(); 
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- 3. СОЗДАТЬ НОВЫЙ ТОВАР (Админ) ---
router.post('/', verifyToken, async (req, res) => {
  try {
    const newProduct = new Product({
      name: req.body.name,
      baseDescription: req.body.baseDescription,
      totalStockMl: req.body.totalStockMl, 
      variants: req.body.variants, 
      isHidden: req.body.isHidden || false,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания товара' });
  }
});

// --- 4. ДОБАВИТЬ ОТЗЫВ (Только для купивших) ---
router.post('/:id/reviews', verifyToken, async (req, res) => {
  const { rating, comment } = req.body;
  
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    // 1. Проверяем, оставлял ли уже отзыв этот пользователь
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user.userId
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Вы уже оставили отзыв к этому товару' });
    }

    // 2. ПРОВЕРКА: Купил ли пользователь этот товар?
    const orders = await Order.find({ 
      user: req.user.userId, 
      status: { $ne: 'Отменено' } 
    });
    
    const hasPurchased = orders.some(order => 
      order.orderItems.some(item => item.product_id.toString() === product._id.toString())
    );

    if (!hasPurchased) {
      return res.status(400).json({ message: 'Вы можете оставить отзыв только о купленном товаре.' });
    }

    // 3. Создаем отзыв
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user.userId,
    };

    product.reviews.push(review);

    // 4. Пересчитываем рейтинг
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Отзыв добавлен' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка добавления отзыва' });
  }
});

// --- PATCH (Обновить) ---
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; 
        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Товар не найден' });
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// --- DELETE (Удалить) ---
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) return res.status(404).json({ message: 'Товар не найден' });
        res.status(200).json({ message: 'Товар успешно удален' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;