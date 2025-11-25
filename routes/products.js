const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const { keyword, category, gender, minPrice, maxPrice, sort } = req.query;
    let query = { isHidden: false };

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { baseDescription: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (gender && gender !== 'All') query.gender = gender;
    
    if (minPrice || maxPrice) {
      let priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      query['variants.price'] = priceQuery;
    }

    let sortOption = {};
    if (sort === 'price_asc') sortOption['variants.0.price'] = 1;
    else if (sort === 'price_desc') sortOption['variants.0.price'] = -1;
    else sortOption['createdAt'] = -1;

    const products = await Product.find(query).sort(sortOption);
    res.status(200).json(products || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
       return res.status(404).json({ message: 'Invalid ID' });
    }
    const product = await Product.findById(req.params.id).populate('similarProducts');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const { name, baseDescription, totalStockMl, category, gender, variants: variantsString, similarProducts } = req.body;
    
    let variants = [];
    try { variants = JSON.parse(variantsString); } catch(e) {}

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
        try { similarIds = JSON.parse(similarProducts); } catch(e) {}
    }

    const newProduct = new Product({
      name,
      baseDescription,
      totalStockMl: Number(totalStockMl),
      category: category || 'Fresh',
      gender: gender || 'Unisex',
      variants, 
      isHidden: false,
      similarProducts: similarIds
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

router.post('/:id/reviews', verifyToken, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

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
    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
});

router.patch('/:id', verifyToken, upload.any(), async (req, res) => {
    try {
        const { id } = req.params;
        let updates = req.body;

        if (req.files && req.files.length > 0) {
            const product = await Product.findById(id);
            if (!product) return res.status(404).json({ message: 'Not found' });
            
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
        console.error('Error PATCH /:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

module.exports = router;