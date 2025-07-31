// server.js – updated CORS logic
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();
/* ——— static first ——— */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const caseRoutes = require('./src/routes/caseRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');

connectDB();



// UPDATED: Use the correct current frontend URL
const allowedOrigins = [
  'https://main.d1vjhvv9srhnme.amplifyapp.com',    // current frontend URL
  'https://main.d1vjhvv9srhnme.amplifyapp.com/',   // with trailing slash
  'http://localhost:5173',                          // local dev
  'http://localhost:5173/'                          // local dev with slash
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow tools like Postman (no Origin header)
    if (!origin) return cb(null, true);
    
    // Check if origin is in allowed list (no need to clean since we include both versions)
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

app.use(cors(corsOptions));           // automatic pre‑flight handling
app.options('*', cors(corsOptions));  // manual catch‑all (older clients)

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


/* ---------- SIMPLE RATE‑LIMIT ---------- */
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 100,                // 100 reqs / IP / minute
  message: 'Too many requests—please retry later.'
}));


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));