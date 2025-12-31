const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration với credentials
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

app.get('/', (req, res) => {
  res.json({ message: 'IoT Backend API đang chạy' });
});

app.use('/api', require('./routes'));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: 'Route không tồn tại' });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});

module.exports = app;

