// server.js - ES Module version
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static PDF files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Middleware to parse JSON and form data (for file uploads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
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

// 🛡️ Add fallback CORS headers for AWS App Runner
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests—please retry later.'
}));

// Connect to MongoDB
import connectDB from './src/config/db.js';
connectDB();

// Import and use routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import quizRoutes from './src/routes/quizRoutes.js';
import videoRoutes from './src/routes/videoRoutes.js';
import caseRoutes from './src/routes/caseRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import userPdfRoutes from './src/routes/userPdfRoutes.js';
import adminPdfRoutes from './src/routes/adminPDFRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', userPdfRoutes);
app.use('/api/admin/pdf', adminPdfRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
