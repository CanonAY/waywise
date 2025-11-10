const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock user storage for MVP (replace with database)
const users = new Map();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.user_id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256' }
  );
};

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      user_id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    users.set(email, user);

    // Return user data (without password)
    const { password: _, ...userResponse } = user;
    res.status(201).json(userResponse);

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data'
        }
      });
    }

    const { email, password } = req.body;
    const user = users.get(email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return response
    const { password: _, ...userResponse } = user;
    res.status(200).json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      }
    });
  }
});

module.exports = router;