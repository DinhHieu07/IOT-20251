/**
 * Script test MQTT - Publish message giả lập dữ liệu từ ESP32
 * 
 * Sử dụng: node scripts/testMqtt.js
 * 
 * Script này sẽ publish message lên MQTT broker để test backend service
 */

const mqtt = require('mqtt');
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình MQTT broker (sử dụng broker public miễn phí cho test)
const MQTT_CONFIG = {
  host: process.env.MQTT_BROKER_URL || 'broker.emqx.io',
  port: parseInt(process.env.MQTT_PORT || '1883'),
  protocol: process.env.MQTT_PROTOCOL || 'mqtt', // mqtt cho non-TLS
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  clientId: `test_client_${Date.now()}`,
};

const brokerUrl = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;
const topic = 'iot/sensor/data';

console.log('=== MQTT Test Script ===');
console.log(`Kết nối đến: ${brokerUrl}`);
console.log(`Topic: ${topic}\n`);

// Kết nối MQTT
const client = mqtt.connect(brokerUrl, {
  username: MQTT_CONFIG.username,
  password: MQTT_CONFIG.password,
  clientId: MQTT_CONFIG.clientId,
});

let messageCount = 0;

client.on('connect', () => {
  console.log('✓ Đã kết nối MQTT broker thành công!\n');
  
  // Gửi message test đầu tiên ngay lập tức
  sendTestMessage('SAFE');
  
  // Gửi message định kỳ mỗi 5 giây
  const interval = setInterval(() => {
    messageCount++;
    
    // Luân phiên giữa các mức độ nguy hiểm
    let dangerLevel;
    let reason;
    let fanStatus;
    
    if (messageCount % 10 === 0) {
      // Mỗi 10 message, gửi mức DANGER
      dangerLevel = 2;
      reason = 'DANGER';
      fanStatus = 'AUTO_ON';
    } else if (messageCount % 5 === 0) {
      // Mỗi 5 message, gửi mức WARNING
      dangerLevel = 1;
      reason = 'WARNING';
      fanStatus = 'AUTO_ON';
    } else {
      // Các message khác là SAFE
      dangerLevel = 0;
      reason = 'SAFE';
      fanStatus = 'AUTO_OFF';
    }
    
    sendTestMessage(reason, dangerLevel, fanStatus);
  }, 5000);
  
  // Dừng sau 2 phút
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n✓ Đã gửi đủ message test. Đang ngắt kết nối...');
    client.end();
    process.exit(0);
  }, 120000); // 2 phút
});

client.on('error', (error) => {
  console.error('✗ Lỗi kết nối MQTT:', error.message);
  process.exit(1);
});

client.on('offline', () => {
  console.log('⚠ Client đã offline');
});

// Hàm tạo và gửi message test
function sendTestMessage(reason = 'SAFE', dangerLevel = 0, fanStatus = 'AUTO_OFF') {
  const deviceId = 'ESP32_IOT_Device_001';
  
  // Tạo dữ liệu cảm biến dựa trên mức độ nguy hiểm
  let mq2Value, mq7Value, mq135Value;
  
  if (dangerLevel === 2) {
    // Mức DANGER - giá trị cao
    mq2Value = { adc: 800, ratio: 1.5, ppm: 250.00 };
    mq7Value = { adc: 600, ratio: 1.3, ppm: 120.00 };
    mq135Value = { adc: 900, ratio: 1.8, ppm: 1200.00 };
  } else if (dangerLevel === 1) {
    // Mức WARNING - giá trị trung bình
    mq2Value = { adc: 400, ratio: 1.2, ppm: 150.00 };
    mq7Value = { adc: 300, ratio: 1.1, ppm: 50.00 };
    mq135Value = { adc: 500, ratio: 1.3, ppm: 800.00 };
  } else {
    // Mức SAFE - giá trị thấp
    mq2Value = { adc: 6, ratio: 1.000, ppm: 0.00 };
    mq7Value = { adc: 0, ratio: 1.000, ppm: 0.00 };
    mq135Value = { adc: 0, ratio: 1.000, ppm: 400.00 };
  }
  
  const message = {
    cnt: messageCount + 1,
    device_id: deviceId,
    mq2: mq2Value,
    mq7: mq7Value,
    mq135: mq135Value,
    danger_level: dangerLevel,
    fan1: fanStatus === 'AUTO_ON' && dangerLevel >= 1 ? 1 : 0,
    fan2: fanStatus === 'AUTO_ON' && dangerLevel >= 2 ? 1 : 0,
    manual_control: 0,
    fan_status: fanStatus,
    reason: reason,
    timestamp: Math.floor(Date.now() / 1000),
  };
  
  client.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
    if (error) {
      console.error(`✗ Lỗi publish message ${messageCount + 1}:`, error.message);
    } else {
      const statusIcon = dangerLevel === 2 ? '🔴' : dangerLevel === 1 ? '🟡' : '🟢';
      console.log(`${statusIcon} [${messageCount + 1}] Đã gửi message - ${reason} (danger_level: ${dangerLevel})`);
      console.log(`   MQ2: ${mq2Value.ppm}ppm | MQ7: ${mq7Value.ppm}ppm | MQ135: ${mq135Value.ppm}ppm`);
    }
  });
}

// Xử lý tín hiệu dừng
process.on('SIGINT', () => {
  console.log('\n\n⚠ Đang dừng script...');
  client.end();
  process.exit(0);
});

