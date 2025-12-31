const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const testUsers = [
  {
    username: 'admin',
    email: 'admin@iot.com',
    password: 'admin123',
    fullName: 'Administrator',
    role: 'admin',
  },
  {
    username: 'viewer',
    email: 'viewer@iot.com',
    password: 'viewer123',
    fullName: 'Viewer User',
    role: 'viewer',
  },
];

const createTestUsers = async () => {
  try {
    // Kết nối database
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/iot-db',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log('Đã kết nối MongoDB\n');

    let createdCount = 0;
    let skippedCount = 0;

    // Tạo từng user
    for (const userData of testUsers) {
      try {
        // Kiểm tra xem user đã tồn tại chưa
        const existingUser = await User.findOne({ username: userData.username });
        
        if (existingUser) {
          console.log(`⚠️  User "${userData.username}" đã tồn tại - Bỏ qua`);
          skippedCount++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Tạo user mới
        const newUser = new User({
          ...userData,
          password: hashedPassword,
        });

        await newUser.save();
        console.log(`✅ Đã tạo user: ${userData.username} (${userData.role})`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}\n`);
        createdCount++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User "${userData.username}" đã tồn tại (duplicate key) - Bỏ qua\n`);
          skippedCount++;
        } else {
          console.error(`❌ Lỗi khi tạo user "${userData.username}":`, error.message);
        }
      }
    }

    console.log('\n📊 Tổng kết:');
    console.log(`   ✅ Đã tạo: ${createdCount} user(s)`);
    console.log(`   ⚠️  Đã bỏ qua: ${skippedCount} user(s)`);
    console.log(`\n💡 Bạn có thể sử dụng các tài khoản trên để đăng nhập`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

createTestUsers();

