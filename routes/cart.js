const express = require('express');
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/add', auth, async (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).send({ message: 'Access denied' });
  }
  try {
    let cart = await Cart.findOne({ buyerId: req.user.userId });
    if (!cart) {
      cart = new Cart({ buyerId: req.user.userId, products: [] });
    }
    // Add product to cart and update totalCartValue
    // Implement the logic here
    await cart.save();
    res.send(cart);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Implement remove from cart route here

module.exports = router;