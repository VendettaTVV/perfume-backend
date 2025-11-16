// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken'); // 1. Импортируем "охранника"

// --- 1. ПОЛУЧИТЬ ВСЕ ТОВАРЫ ---
//
// ❗️❗️ ЭТОТ РОУТ ДОЛЖЕН БЫТЬ ПУБЛИЧНЫМ ❗️❗️
// (verifyToken здесь НЕТ)
//
router.get('/', async (req, res) => {
  try {
    const products = await Product.find(); // Найти все товары в БД
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при получении товаров.' });
  }
});

// --- 2. СОЗДАТЬ НОВЫЙ ТОВАР (для Админки) ---
//
// ❗️❗️ ЭТОТ РОУТ ЗАЩИЩЕН ❗️❗️
// (verifyToken здесь ЕСТЬ)
//
router.post('/', verifyToken, async (req, res) => {
  try {
    // req.user теперь доступен благодаря verifyToken
    console.log(`Запрос на создание товара от пользователя: ${req.user.name}`);

    const newProduct = new Product({
      name: req.body.name,
      baseDescription: req.body.baseDescription,
      variants: req.body.variants,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct); // 201 = "Создано"

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при создании товара.' });
  }
});

module.exports = router;