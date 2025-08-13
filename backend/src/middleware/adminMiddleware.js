import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { tokenBlacklist } from '../utils/tokenBlacklist.js';

const adminMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format. Expected: Bearer <token>' });
  }

  const token = parts[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // ✅ Check blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token is invalid (logged out)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

export default adminMiddleware;
