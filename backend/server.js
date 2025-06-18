// server.js  – updated CORS logic
const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const connectDB     = require('./src/config/db');
const authRoutes    = require('./src/routes/authRoutes');
const userRoutes    = require('./src/routes/userRoutes');
const quizRoutes    = require('./src/routes/quizRoutes');
const videoRoutes   = require('./src/routes/videoRoutes');
const caseRoutes    = require('./src/routes/caseRoutes');
const adminRoutes   = require('./src/routes/adminRoutes');

connectDB();

const app = express();


const allowedOrigins = [
  'https://main.d3e4kbhw1zamih.amplifyapp.com', // production
  'http://localhost:5173'                        // local dev
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow tools like Postman (no Origin header)
    if (!origin) return cb(null, true);

    // Remove a trailing “/” if the browser adds one
    const cleanOrigin = origin.replace(/\/$/, '');

    return allowedOrigins.includes(cleanOrigin)
      ? cb(null, true)
      : cb(new Error('Blocked by CORS'));        // exact‑match required
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));           // automatic pre‑flight handling
app.options('*', cors(corsOptions));  // manual catch‑all (older clients)


app.use(express.json());

app.use('/api/auth',  authRoutes);
app.use('/api/user',  userRoutes);
app.use('/api/quiz',  quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case',  caseRoutes);
app.use('/api/admin', adminRoutes);

/* ---------- SIMPLE RATE‑LIMIT ---------- */
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 100,                // 100 reqs / IP / minute
  message: 'Too many requests—please retry later.'
}));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
