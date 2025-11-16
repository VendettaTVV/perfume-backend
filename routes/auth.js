// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Импорт нашей модели
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- РЕГИСТРАЦИЯ ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует.' });
    }

    // 2. Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Создаем нового пользователя
    const newUser = new User({
      name: name,
      email: email,
      password_hash: passwordHash,
    });

    // 4. Сохраняем в БД
    const savedUser = await newUser.save();

    res.status(201).json({ message: 'Регистрация прошла успешно!', userId: savedUser._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации.' });
  }
});

// --- ВХОД (ЛОГИН) ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Ищем пользователя по email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль.' });
    }

    // 2. Сравниваем пароль с хешем в БД
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль.' });
    }

    // 3. Создаем JWT-токен
    const token = jwt.sign(
      { userId: user._id, name: user.name }, // Данные, которые мы зашифруем в токен
      process.env.JWT_SECRET, // Наш секретный ключ из .env
      { expiresIn: '1h' } // Время жизни токена
    );

    res.status(200).json({
      message: 'Вход выполнен успешно!',
      token: token,
      user: { name: user.name, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при входе.' });
  }
});

module.exports = router;