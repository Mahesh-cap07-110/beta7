const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a product
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Access denied' });
  }
  try {
    const product = new Product({
      ...req.body,
      sellerId: req.user.userId
    });
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Read all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read a specific product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    if (req.user.role !== 'admin' && product.sellerId.toString() !== req.user.userId) {
      return res.status(403).send({ message: 'Access denied' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    if (req.user.role !== 'admin' && product.sellerId.toString() !== req.user.userId) {
      return res.status(403).send({ message: 'Access denied' });
    }
    await product.remove();
    res.send({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;