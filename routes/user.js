const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// All routes in this file require authentication
router.use(verifyToken);

// 1. GET WISHLIST
router.get('/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out nulls in case a product was deleted
    const wishlistItems = user.wishlist.filter(item => item !== null);

    res.status(200).json(wishlistItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. ADD/REMOVE FROM WISHLIST (Toggle)
router.post('/wishlist/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      // Add product
      user.wishlist.push(productId);
      await user.save();
      res.status(200).json({ message: 'Added to favourites', isLiked: true });
    } else {
      // Remove product
      user.wishlist.splice(index, 1);
      await user.save();
      res.status(200).json({ message: 'Removed from favourites', isLiked: false });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;