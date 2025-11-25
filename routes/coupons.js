const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Access denied' });

  try {
    const { code, discountPercent, expiryDate } = req.body;

    const newCoupon = new Coupon({
      code,
      discountPercent,
      expiryDate,
    });

    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating coupon' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Coupon is inactive' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    res.status(200).json({
      isValid: true,
      discountPercent: coupon.discountPercent,
      code: coupon.code
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Validation error' });
  }
});

module.exports = router;