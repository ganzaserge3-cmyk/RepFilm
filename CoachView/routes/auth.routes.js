const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../db');

const router = express.Router();

function signToken(user) {
  const payload = { sub: String(user.id), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) return res.status(409).json({ message: 'email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(normalizedEmail, hashedPassword, role === 'coach' ? 'coach' : 'viewer');
    const token = signToken(user);

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const normalizedEmail = String(email).toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'login failed' });
  }
});

module.exports = router;

