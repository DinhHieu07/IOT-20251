const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const Sensor = require('../models/Sensor');
const Threshold = require('../models/Threshold');

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

      // Tìm hoặc tạo các sensor cho device
      const sensorTypes = ['MQ2', 'MQ7', 'MQ135'];
      const sensorValues = {
        MQ2: data.mq2?.ppm || 0,
        MQ7: data.mq7?.ppm || 0,
        MQ135: data.mq135?.ppm || 0,
      };

      const systemStatus = {
        safetyLevel: data.danger_level + 1, // Chuyển từ 0,1,2 sang 1,2,3
        fan1Status: data.fan1 === 1,
        fan2Status: data.fan2 === 1,
      };

      // Lưu dữ liệu cho từng sensor
      const savedSensorData = [];
      for (const sensorType of sensorTypes) {
        // Tìm hoặc tạo sensor
        let sensor = await Sensor.findOne({ 
          deviceId: device._id, 
          type: sensorType 
        });

        if (!sensor) {
          sensor = await Sensor.create({
            deviceId: device._id,
            type: sensorType,
            unit: 'ppm',
            isActive: true,
          });
          console.log(`[MQTT] Đã tạo sensor mới: ${sensorType}`);
        }

        // Lưu dữ liệu cảm biến
        const sensorData = await SensorData.create({
          sensorId: sensor._id,
          value: sensorValues[sensorType],
          systemStatus: systemStatus,
          timestamp: new Date(),
        });

        savedSensorData.push(sensorData);
      }

      console.log(`[MQTT] ✓ Đã lưu dữ liệu cảm biến cho ${savedSensorData.length} sensor`);

      // Kiểm tra và tạo alert nếu danger_level > 0
      if (data.danger_level > 0) {
        await this.createAlert(device._id, data);
      }
    } catch (error) {
      console.error('[MQTT] ✗ Lỗi xử lý dữ liệu cảm biến:', error);
    }
  }

  // Tạo alert khi vượt ngưỡng
  async createAlert(deviceId, data) {
    try {
      // Lấy threshold của device
      const threshold = await Threshold.findOne({ deviceId });
      if (!threshold) {
        console.log('[MQTT] Không tìm thấy threshold cho device, bỏ qua tạo alert');
        return;
      }

      // Tìm sensor có giá trị cao nhất vượt ngưỡng
      const sensorData = [
        { type: 'MQ2', value: data.mq2?.ppm || 0, thresholds: threshold.mq2 },
        { type: 'MQ7', value: data.mq7?.ppm || 0, thresholds: threshold.mq7 },
        { type: 'MQ135', value: data.mq135?.ppm || 0, thresholds: threshold.mq135 },
      ];

      // Xác định sensor vượt ngưỡng và mức độ
      let alertSensor = null;
      let alertType = null;
      let thresholdValue = 0;

      for (const sensor of sensorData) {
        if (data.danger_level === 2 && sensor.value >= sensor.thresholds.danger) {
          // Vượt ngưỡng danger
          if (!alertSensor || sensor.value > alertSensor.value) {
            alertSensor = sensor;
            alertType = 'DANGER';
            thresholdValue = sensor.thresholds.danger;
          }
        } else if (data.danger_level === 1 && sensor.value >= sensor.thresholds.warning) {
          // Vượt ngưỡng warning
          if (!alertSensor || sensor.value > alertSensor.value) {
            alertSensor = sensor;
            alertType = 'WARNING';
            thresholdValue = sensor.thresholds.warning;
          }
        }
      }

      if (!alertSensor) {
        console.log('[MQTT] Không tìm thấy sensor vượt ngưỡng, bỏ qua tạo alert');
        return;
      }

      // Tìm hoặc tạo sensor trong database
      let sensor = await Sensor.findOne({ 
        deviceId, 
        type: alertSensor.type 
      });

      if (!sensor) {
        sensor = await Sensor.create({
          deviceId,
          type: alertSensor.type,
          unit: 'ppm',
          isActive: true,
        });
        console.log(`[MQTT] Đã tạo sensor mới: ${sensor.type}`);
      }

      // Tạo message dựa trên mức độ
      let message = '';
      if (alertType === 'WARNING') {
        message = `Cảm biến ${alertSensor.type} đã vượt ngưỡng cảnh báo (${alertSensor.value.toFixed(2)} ppm > ${thresholdValue} ppm)`;
      } else if (alertType === 'DANGER') {
        message = `Cảm biến ${alertSensor.type} đã vượt ngưỡng nguy hiểm (${alertSensor.value.toFixed(2)} ppm > ${thresholdValue} ppm)`;
      }

      // Tạo alert
      const alert = await Alert.create({
        sensorId: sensor._id,
        type: alertType,
        message: message,
        sensorValue: alertSensor.value,
        thresholdValue: thresholdValue,
        isResolved: false,
        timestamp: new Date(),
      });

      console.log(`[MQTT] ✓ Đã tạo alert: ${alert._id} - ${message}`);
    } catch (error) {
      console.error('[MQTT] ✗ Lỗi tạo alert:', error);
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

  // Tắt tất cả quạt
  async turnOffAllFans(deviceId) {
    return await this.controlDevice(deviceId, { cmd: "fan_off" });
  }

  // Bật quạt theo chỉ định
  async turnOnFans(deviceId, fan1 = false, fan2 = false) {
    return await this.controlDevice(deviceId, { 
      cmd: "fan_on", 
      fan1: fan1 ? 1 : 0, 
      fan2: fan2 ? 1 : 0 
    });
  }

  // Chuyển về chế độ tự động
  async setAutoMode(deviceId) {
    return await this.controlDevice(deviceId, { cmd: "auto" });
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

