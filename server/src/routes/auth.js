const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../utils/db');
const config = require('../utils/config');
const authenticate = require('../middleware/authenticate');
 
const AuthInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const DayAvailability = z.object({
  available: z.boolean(),
  start: z.string(),
  end: z.string(),
})

const ProfileInput = z.object({
  timezone: z.string().min(1),
  preferred_time: z.enum(['morning', 'afternoon', 'evening']),
  weekly_target_hours: z.coerce.number().min(1).max(168),
  availability: z.object({
    monday: DayAvailability,
    tuesday: DayAvailability,
    wednesday: DayAvailability,
    thursday: DayAvailability,
    friday: DayAvailability,
    saturday: DayAvailability,
    sunday: DayAvailability,
  })
});
 
function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
}
 
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
}
 
// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = AuthInput.parse(req.body);
 
    // Cek apakah email sudah terdaftar
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'all fields required'});
    }
 
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );
 
    const userId = result.rows[0].id;
 
    // Buat profile default
    await db.query(
      'INSERT INTO profiles (user_id) VALUES ($1)',
      [userId]
    );
 
    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);
 
    res.status(201).json({ token, refreshToken, userId });
  } catch (err) {
    next(err);
  }
});
 
// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = AuthInput.parse(req.body);
 
    const result = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
 
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
 
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
 
    res.json({ token, refreshToken, userId: user.id });
  } catch (err) {
    next(err);
  }
});
 
// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.created_at, p.timezone, p.preferred_time, p.weekly_target_hours, p.availability
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
 
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
 
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;

// Put update user profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const {
      timezone,
      preferred_time,
      weekly_target_hours,
      availability,
    } = ProfileInput.parse(req.body);

    const result = await db.query(
      `UPDATE profiles
      SET timezone = $1,
          preferred_time = $2,
          weekly_target_hours = $3,
          availability = $4
      WHERE user_id = $5
      RETURNING timezone, preferred_time, weekly_target_hours, availability`,
      [timezone, preferred_time, weekly_target_hours, JSON.stringify(availability), req.user.id,]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /me error:', err);
    next(err);
  }
});