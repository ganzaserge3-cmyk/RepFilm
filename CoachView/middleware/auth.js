const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'missing auth token' });

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'invalid/expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'unauthenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole };

