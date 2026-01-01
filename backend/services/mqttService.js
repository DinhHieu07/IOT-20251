const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  // Kết nối đến HiveMQ Cloud
  connect() {
    const mqttConfig = {
      host: process.env.MQTT_BROKER_URL || 'your-instance.hivemq.cloud',
      port: parseInt(process.env.MQTT_PORT || '8883'),
      protocol: process.env.MQTT_PROTOCOL || 'mqtts', // mqtts cho TLS, mqtt cho non-TLS
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      clientId: `backend_${Date.now()}`,
      reconnectPeriod: 5000, // Tự động reconnect sau 5 giây
      connectTimeout: 30000, // Timeout 30 giây
      rejectUnauthorized: false, // Bỏ qua SSL certificate verification (chỉ dùng cho development)
    };

    const brokerUrl = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port}`;
    
    console.log(`[MQTT] Đang kết nối đến ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      username: mqttConfig.username,
      password: mqttConfig.password,
      clientId: mqttConfig.clientId,
      reconnectPeriod: mqttConfig.reconnectPeriod,
      connectTimeout: mqttConfig.connectTimeout,
      rejectUnauthorized: mqttConfig.rejectUnauthorized,
    });

    // Event handlers
    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[MQTT] ✓ Đã kết nối thành công');
      this.subscribeTopics();
    });

    this.client.on('error', (error) => {
      console.error('[MQTT] ✗ Lỗi:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('[MQTT] Kết nối đã đóng');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`[MQTT] Đang thử kết nối lại... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      } else {
        console.error('[MQTT] ✗ Đã vượt quá số lần thử kết nối lại');
        this.client.end();
      }
    });

    this.client.on('offline', () => {
      console.log('[MQTT] Client đã offline');
      this.isConnected = false;
    });

    // Xử lý messages
    this.client.on('message', async (topic, message) => {
      try {
        await this.handleMessage(topic, message.toString());
      } catch (error) {
        console.error('[MQTT] Lỗi xử lý message:', error);
      }
    });
  }

  // Subscribe các topics
  subscribeTopics() {
    const topics = [
      'iot/sensor/data', // Topic nhận dữ liệu cảm biến
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[MQTT] ✗ Lỗi subscribe topic ${topic}:`, err);
        } else {
          console.log(`[MQTT] ✓ Đã subscribe topic: ${topic}`);
        }
      });
    });
  }

  // Xử lý message nhận được
  async handleMessage(topic, message) {
    console.log(`[MQTT] Nhận message từ topic: ${topic}`);
    console.log(`[MQTT] Message: ${message}`);

    if (topic === 'iot/sensor/data') {
      await this.handleSensorData(message);
    }
  }

  // Xử lý dữ liệu cảm biến và lưu vào database
  async handleSensorData(message) {
    try {
      const data = JSON.parse(message);
      
      // Tìm hoặc tạo device dựa trên device_id
      let device = await Device.findOne({ macAddress: data.device_id });
      if (!device) {
        // Tạo device mới nếu chưa tồn tại
        device = await Device.create({
          name: `Device ${data.device_id}`,
          macAddress: data.device_id,
          location: 'Chưa xác định',
          status: 'online',
          lastSeen: new Date(),
          fanRuntime: {
            fan1TotalMs: 0,
            fan2TotalMs: 0,
            lastUpdated: new Date()
          }
        });
        console.log(`[MQTT] Đã tạo device mới: ${device.macAddress}`);
      } else {
        // Cập nhật trạng thái device
        device.status = 'online';
        device.lastSeen = new Date();
        
        // Cập nhật thời gian hoạt động quạt nếu có trong data
        if (data.fan_runtime) {
          device.fanRuntime.fan1TotalMs = data.fan_runtime.fan1_total_ms || device.fanRuntime.fan1TotalMs;
          device.fanRuntime.fan2TotalMs = data.fan_runtime.fan2_total_ms || device.fanRuntime.fan2TotalMs;
          device.fanRuntime.lastUpdated = new Date();
        }
        
        await device.save();
      }

      // Lưu dữ liệu cảm biến
      const sensorData = await SensorData.create({
        deviceId: device._id,
        values: {
          mq2: data.mq2?.ppm || 0,
          mq7: data.mq7?.ppm || 0,
          mq135: data.mq135?.ppm || 0,
        },
        systemStatus: {
          safetyLevel: data.danger_level + 1, // Chuyển từ 0,1,2 sang 1,2,3
          fan1Status: data.fan1 === 1,
          fan2Status: data.fan2 === 1,
        },
        timestamp: new Date(),
      });

      console.log(`[MQTT] ✓ Đã lưu dữ liệu cảm biến: ${sensorData._id}`);
    } catch (error) {
      console.error('[MQTT] ✗ Lỗi xử lý dữ liệu cảm biến:', error);
    }
  }

  // Publish message lên MQTT (để điều khiển thiết bị)
  publish(topic, message) {
    if (!this.isConnected || !this.client) {
      console.error('[MQTT] ✗ Không thể publish: Client chưa kết nối');
      return false;
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
        if (error) {
          console.error(`[MQTT] ✗ Lỗi publish lên ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] ✓ Đã publish lên ${topic}:`, JSON.stringify(message));
          resolve(true);
        }
      });
    });
  }

  // Điều khiển thiết bị
  async controlDevice(deviceId, command) {
    const topic = 'iot/device/control';
    const message = {
      device_id: deviceId,
      ...command,
    };

    return await this.publish(topic, message);
  }

  // Ngắt kết nối
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('[MQTT] Đã ngắt kết nối');
    }
  }
}

// Export singleton instance
const mqttService = new MQTTService();

module.exports = mqttService;

