import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminMiddleware = async (req, res, next) => {
  console.log('=== ADMIN MIDDLEWARE START ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  
  const authHeader = req.header('Authorization');
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Invalid authorization format:', authHeader);
    return res.status(401).json({ error: 'Invalid authorization format. Expected: Bearer <token>' });
  }

  const token = parts[1];
  if (!token) {
    console.log('No token found in authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Token present, length:', token.length);

  try {
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully. Admin ID:', decoded.id);
    
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      console.log('Admin not found in database:', decoded.id);
      return res.status(403).json({ error: 'Admin not found' });
    }

    console.log('Admin found:', {
      id: admin._id,
      email: admin.email || 'N/A'
    });

    req.admin = admin;
    console.log('=== ADMIN MIDDLEWARE SUCCESS ===');
    next();
  } catch (err) {
    console.error('=== ADMIN MIDDLEWARE ERROR ===');
    console.error('JWT Error:', err.message);
    console.error('================================');
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

export default adminMiddleware;