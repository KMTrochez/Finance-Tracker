const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { passwordValidator } = require('../utils/validators');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for login (5 attempts per 15 min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!passwordValidator(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ message: 'Login successful.', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Logout
const tokenBlacklist = new Set();
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    tokenBlacklist.add(token);
  }
  res.json({ message: 'Logged out successfully.' });
});

module.exports = { router, tokenBlacklist };