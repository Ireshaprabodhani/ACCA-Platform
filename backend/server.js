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

 app.use(cors({
  origin: 'http://localhost:5173',       
  credentials: true                     
}));


app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/admin', adminRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
