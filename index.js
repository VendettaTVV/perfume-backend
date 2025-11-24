// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const userRoutes = require('./routes/user'); // 👈 1. НОВЫЙ ИМПОРТ
const { getSalesAnalytics } = require('./controllers/adminController');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Подключение к MongoDB Atlas установлено'))
.catch((err) => console.error('❌ Ошибка подключения к MongoDB:', err));

app.post('/api/checkout/webhook', 
  express.raw({type: 'application/json'}), 
  checkoutRoutes 
);

app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/user', userRoutes); // 👈 2. ПОДКЛЮЧЕНИЕ РОУТА

app.get('/api/orders/analytics', getSalesAnalytics); 

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});