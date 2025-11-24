const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');

// --- Multer Config ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- 1. PUBLIC: GET PRODUCTS ---
router.get('/', async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice } = req.query;
    let query = { isHidden: false };

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { baseDescription: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    
    if (minPrice || maxPrice) {
      let priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      query['variants.price'] = priceQuery;
    }

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- 1.1 PUBLIC: GET SINGLE PRODUCT ---
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('similarProducts');
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- 2. ADMIN: GET ALL ---
router.get('/all', verifyToken, async (req, res) => {
  try {
    const products = await Product.find(); 
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- 3. ADMIN: CREATE PRODUCT ---
router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const { name, baseDescription, totalStockMl, category, variants: variantsString, similarProducts } = req.body;
    let variants = JSON.parse(variantsString);

    if (req.files) {
      req.files.forEach(file => {
          const index = parseInt(file.fieldname.split('-')[1]);
          if (variants[index]) {
              variants[index].image = `http://localhost:5000/uploads/${file.filename}`;
          }
      });
    }

    let similarIds = [];
    if (similarProducts) {
        similarIds = JSON.parse(similarProducts);
    }

    const newProduct = new Product({
      name,
      baseDescription,
      totalStockMl: Number(totalStockMl),
      category: category || 'Fresh',
      variants, 
      isHidden: false,
      similarProducts: similarIds
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания' });
  }
});

// --- 4. REVIEWS ---
router.post('/:id/reviews', verifyToken, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user.userId,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Отзыв добавлен' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка' });
  }
});

// --- 5. ADMIN: UPDATE (PATCH) ---
router.patch('/:id', verifyToken, upload.any(), async (req, res) => {
    try {
        const { id } = req.params;
        let updates = req.body;

        if (req.files && req.files.length > 0) {
            const product = await Product.findById(id);
            if (!product) return res.status(404).json({ message: 'Не найдено' });
            
            let variants = updates.variants ? JSON.parse(updates.variants) : product.variants;
            req.files.forEach(file => {
                const index = parseInt(file.fieldname.split('-')[1]);
                if (variants[index]) {
                    variants[index].image = `http://localhost:5000/uploads/${file.filename}`;
                }
            });
            updates.variants = variants;
        } else if (typeof updates.variants === 'string') {
             updates.variants = JSON.parse(updates.variants);
        }

        if (updates.similarProducts && typeof updates.similarProducts === 'string') {
             updates.similarProducts = JSON.parse(updates.similarProducts);
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// --- 6. ADMIN: DELETE ---
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка' }); }
});

module.exports = router;