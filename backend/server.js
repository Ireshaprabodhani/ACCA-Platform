// server.js - ES Module version
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    }
  }
}));

// Import routes
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import quizRoutes from './src/routes/quizRoutes.js';
import videoRoutes from './src/routes/videoRoutes.js';
import caseRoutes from './src/routes/caseRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import userPdfRoutes from './src/routes/userPdfRoutes.js';
import adminPdfRoutes from './src/routes/adminPDFRoutes.js';

connectDB();

// CORS setup (your existing CORS code)
const allowedOrigins = [
  'https://main.d1vjhvv9srhnme.amplifyapp.com',
  'https://main.d1vjhvv9srhnme.amplifyapp.com/',
  'http://localhost:5173',
  'http://localhost:5173/'
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS allowed origin: ${origin}`);
      return cb(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/pdf', adminPdfRoutes);
app.use('/api/pdf', userPdfRoutes);

// Rate limiting (your existing code)
import rateLimit from 'express-rate-limit';
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests—please retry later.'
}));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));