const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const users = new Map(); // In-memory; replace with DB/Prisma later

function signToken(user) {
  const payload = { sub: String(user.id), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const normalizedEmail = String(email).toLowerCase();
    if (users.has(normalizedEmail)) return res.status(409).json({ message: 'email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = users.size + 1;

    const user = { id, email: normalizedEmail, passwordHash: hashedPassword, role: role === 'coach' ? 'coach' : 'viewer' };
    users.set(normalizedEmail, user);

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const normalizedEmail = String(email).toLowerCase();
    const user = users.get(normalizedEmail);
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'login failed' });
  }
});

// Expose a helper for auth middleware (still in-memory for now)
router._users = users;
router._signToken = signToken;

module.exports = router;

