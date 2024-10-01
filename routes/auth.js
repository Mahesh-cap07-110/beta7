const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const auth = require('../middleware/auth');

const router = express.Router();

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    res.status(201).send({ accessToken, refreshToken });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    res.send({ accessToken, refreshToken });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.role);
    res.send({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).send({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.decode(token);
    const blacklistedToken = new BlacklistedToken({
      token,
      expiresAt: new Date(decoded.exp * 1000)
    });
    await blacklistedToken.save();
    res.send({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;