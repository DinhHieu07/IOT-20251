const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/error.middleware');
const mqttService = require('./services/mqttService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration với credentials
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

app.use(cors(corsOptions));

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Pass io instance to mqttService
mqttService.setSocketIo(io);

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

// Kết nối database
connectDB();

// Kết nối MQTT sau khi database đã kết nối
setTimeout(() => {
  mqttService.connect();
}, 2000); // Đợi 2 giây để database kết nối xong

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Đang tắt server...');
  mqttService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Đang tắt server...');
  mqttService.disconnect();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});

module.exports = app;

