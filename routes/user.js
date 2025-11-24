const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product'); // Нужно, чтобы проверить существование товара
const verifyToken = require('../middleware/verifyToken');

// Все роуты здесь требуют авторизации
router.use(verifyToken);

// 1. ПОЛУЧИТЬ ИЗБРАННОЕ
router.get('/wishlist', async (req, res) => {
  try {
    // Находим пользователя и "раскрываем" (populate) данные о товарах в вишлисте
    const user = await User.findById(req.user.userId).populate('wishlist');
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Отфильтруем null (если товар был удален из магазина, но остался в вишлисте)
    const wishlistItems = user.wishlist.filter(item => item !== null);
    
    res.status(200).json(wishlistItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 2. ДОБАВИТЬ/УДАЛИТЬ ИЗ ИЗБРАННОГО (Toggle)
router.post('/wishlist/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    // Проверяем, есть ли товар уже в списке
    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      // Если нет - добавляем
      user.wishlist.push(productId);
      await user.save();
      res.status(200).json({ message: 'Добавлено в избранное', isLiked: true });
    } else {
      // Если есть - удаляем
      user.wishlist.splice(index, 1);
      await user.save();
      res.status(200).json({ message: 'Удалено из избранного', isLiked: false });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;