const express = require('express');
const cors = require('cors'); // ✅ Add this line
const connectDB = require('./src/config/db');
require('dotenv').config();




const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const caseRoutes = require('./src/routes/caseRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();


connectDB();

const allowedOrigins = [
  'https://main.d3e4kbhw1zamih.amplifyapp.com', // NO trailing slash
  'http://localhost:5173'                        // keep dev origin
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);              
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(express.json());
app.use(cors(corsOptions));               
app.options('*', cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/admin', adminRoutes);

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests
  message: "Too many requests. Please try again later.",
});

app.use(limiter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
