const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

const FREE_SHIPPING_THRESHOLD = 50;

function getShippingCostByPostcode(postcode, method, cartTotal) {
  if (!postcode) return 0;

  const numericTotal = Number(cartTotal);

  if (method === 'standard' && numericTotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  const prefix = postcode.toUpperCase().replace(/\s/g, '').substring(0, 2);
  let basePrice = 8.00;

  if (['CT', 'ME', 'TN'].includes(prefix)) basePrice = 4.00;
  else if (['SE', 'SW', 'E', 'W', 'N', 'NW', 'EC', 'WC', 'BR', 'DA'].includes(prefix)) basePrice = 6.00;
  else if (['AB', 'IV', 'HS', 'KW', 'ZE', 'BT'].includes(prefix)) basePrice = 15.00;

  const expressUplift = (method === 'express') ? 5.00 : 0.00;
  return basePrice + expressUplift;
}

router.post('/calculate-shipping', (req, res) => {
  try {
    const { postcode, method, cartTotal } = req.body;

    if (!postcode || postcode.length < 2) {
      return res.status(200).json({ price: 0.00 });
    }

    const price = getShippingCostByPostcode(postcode, method, cartTotal);
    res.status(200).json({ price: price });
  } catch (error) {
    res.status(500).json({ error: 'Shipping calculation error' });
  }
});

router.post('/create-session', async (req, res) => {
  try {
    const { cartItems, shippingInfo, shippingMethod, userId, couponCode } = req.body;

    const lineItems = [];
    let orderTotal = 0;
    let discountPercent = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && new Date() <= coupon.expiryDate) {
        discountPercent = coupon.discountPercent;
      }
    }

    for (const item of cartItems) {
      const product = await Product.findById(item.id);
      if (!product) return res.status(404).json({ message: `Product ${item.name} not found` });
      
      const variant = product.variants.find(v => v.size === item.size);
      if (!variant) return res.status(404).json({ message: `Variant not found` });

      if (product.totalStockMl < (variant.size * item.quantity)) {
        return res.status(400).json({ message: `Product ${product.name} is out of stock` });
      }

      let finalPrice = variant.price;
      if (discountPercent > 0) {
        finalPrice = variant.price * ((100 - discountPercent) / 100);
      }

      orderTotal += finalPrice * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${product.name} (${variant.size}ml)`,
            images: [variant.image.startsWith('/') ? `${process.env.CLIENT_URL}${variant.image}` : variant.image],
            description: discountPercent > 0 ? `Discount ${discountPercent}% applied` : undefined
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    const shippingPrice = getShippingCostByPostcode(shippingInfo.postcode, shippingMethod, orderTotal);

    if (shippingPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(shippingPrice * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      customer_email: shippingInfo.email,
      metadata: {
        userId: userId || '',
        couponCode: couponCode || '',
        cartItems: JSON.stringify(cartItems.map(item => ({
          product_id: item.id,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        }))),
        shippingInfo: JSON.stringify(shippingInfo),
        shippingPrice: shippingPrice
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: `Stripe Error: ${error.message}` });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const cartItems = JSON.parse(session.metadata.cartItems);
      const shippingInfo = JSON.parse(session.metadata.shippingInfo);
      const shippingPrice = parseFloat(session.metadata.shippingPrice);
      const totalPrice = (session.amount_total / 100);
      const userId = session.metadata.userId;

      const newOrder = await Order.create({
        user: userId ? userId : undefined,
        shippingInfo,
        orderItems: cartItems,
        stripePaymentIntentId: session.payment_intent,
        shippingPrice,
        totalPrice,
        status: 'Paid',
      });

      for (const item of cartItems) {
        const product = await Product.findById(item.product_id);
        if (product) {
          const variant = product.variants.find(v => v.size === item.size);
          const totalMlToSubtract = variant.size * item.quantity;
          product.totalStockMl -= totalMlToSubtract;
          if (product.totalStockMl < 0) product.totalStockMl = 0;
          await product.save();
        }
      }

      if (sendOrderConfirmationEmail) await sendOrderConfirmationEmail(newOrder);

    } catch (err) {
      return res.status(500).json({ error: 'Server Error' });
    }
  }
  res.status(200).json({ received: true });
});

module.exports = router;