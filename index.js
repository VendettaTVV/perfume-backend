// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Загружает переменные из .env

// --- 1. ИМПОРТ РОУТОВ ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- 3. MIDDLEWARE (Промежуточное ПО) ---
// ❗️ ВАЖНО: Middleware должно быть объявлено ДО роутов.
app.use(cors()); // Разрешаем CORS-запросы (от React)
app.use(express.json()); // Позволяем Express читать JSON из тела запроса

// --- 4. ИСПОЛЬЗОВАНИЕ РОУТОВ ---
// Теперь, когда запрос придет, он СНАЧАЛА пройдет через cors(), 
// и только потом попадет на роуты.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// --- 5. ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Подключение к MongoDB Atlas установлено'))
.catch((err) => console.error('❌ Ошибка подключения к MongoDB:', err));

// --- 6. ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});