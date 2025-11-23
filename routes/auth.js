const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- РЕГИСТРАЦИЯ ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name,
      email: email,
      password_hash: passwordHash,
      // isAdmin по умолчанию false
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: 'Регистрация прошла успешно!', userId: savedUser._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации.' });
  }
});

// --- ВХОД (ЛОГИН) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль.' });
    }

    // Создаем токен
    const token = jwt.sign(
      { userId: user._id, name: user.name, isAdmin: user.isAdmin }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ❗️ ОТПРАВЛЯЕМ ID И СТАТУС АДМИНА ЯВНО
    res.status(200).json({
      message: 'Вход выполнен успешно!',
      token: token,
      user: { 
        _id: user._id, // 👈 ВАЖНО: Обязательно отправляем ID
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin 
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при входе.' });
  }
});

// --- СБРОС ПАРОЛЯ (Оставляем как есть) ---
// (Если у вас тут был код сброса пароля, оставьте его или скопируйте из прошлых шагов)
// Для краткости я его здесь не дублирую, но не удаляйте его, если он у вас был.

module.exports = router;