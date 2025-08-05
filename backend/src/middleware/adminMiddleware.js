// middlewares/adminMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(403).json({ error: 'Admin only' });

    req.admin = admin; // attach admin object here
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Use default export
export default adminMiddleware;