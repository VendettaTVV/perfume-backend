// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

// --- 1. ИМПОРТ РОУТОВ ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders'); 
const couponRoutes = require('./routes/coupons'); // 👈 1. НОВЫЙ ИМПОРТ
const { getSalesAnalytics } = require('./controllers/adminController');

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- 3. ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Подключение к MongoDB Atlas установлено'))
.catch((err) => console.error('❌ Ошибка подключения к MongoDB:', err));


// --- 4. MIDDLEWARE ---

// Обработка Webhook (Сырые данные)
app.post('/api/checkout/webhook', 
  express.raw({type: 'application/json'}), 
  checkoutRoutes 
);

app.use(cors()); 
app.use(express.json()); 


// --- 5. ИСПОЛЬЗОВАНИЕ РОУТОВ ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes); // 👈 2. НОВОЕ ПОДКЛЮЧЕНИЕ

// Роут для аналитики
app.get('/api/orders/analytics', getSalesAnalytics); 


// --- 6. ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});