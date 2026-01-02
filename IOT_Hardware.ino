#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <math.h>

// ================= CẤU HÌNH WIFI =================
// const char* ssid = "36 Ho Quynh T4";
// const char* password = "@36Hoquynh2024";
const char *ssid = "Redmi Note 11 Pro";
const char *password = "22222222";

// ================= CẤU HÌNH HIVEMQ CLOUD =================
// Thay đổi các thông tin sau theo HiveMQ Cloud của bạn:
const char* mqtt_server = "MQTT_BROKER_URL"; // Thay bằng broker URL của bạn
const int mqtt_port = 8883; // Port TLS (hoặc 1883 cho non-TLS)
const char* mqtt_username = "MQTT_USERNAME"; // Nếu có authentication
const char* mqtt_password = "MQTT_PASSWORD"; // Nếu có authentication
const char* mqtt_client_id = "ESP32_IOT_Device_001"; // Client ID duy nhất

// Topics MQTT
const char* topic_sensor_data = "iot/sensor/data"; // Topic để gửi dữ liệu cảm biến
const char* topic_device_control = "iot/device/control"; // Topic để nhận lệnh điều khiển

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ================= CẤU HÌNH CHÂN =================
#define MQ7_PIN 34
#define MQ135_PIN 35
#define MQ2_PIN 33
#define RELAY_PIN_1 26 // Chân điều khiển Quạt 1
#define RELAY_PIN_2 27 // Chân điều khiển Quạt 2

// ================= CẤU HÌNH LOGIC RELAY (QUAN TRỌNG) =================
// Với Module Relay đen mini, thường là mức CAO (HIGH) để BẬT.
// Nếu quạt chạy ngược (lúc bình thường thì quay, lúc có khí thì tắt), hãy đổi:
// #define RELAY_ON  LOW
// #define RELAY_OFF HIGH
#define RELAY_ON HIGH
#define RELAY_OFF LOW

// ================= NGƯỠNG CẢNH BÁO (3 MỨC) =================
// Mức 1: AN TOÀN - Không bật quạt nào
// Mức 2: TRUNG BÌNH - Bật 1 quạt
// Mức 3: NGUY HIỂM - Bật cả 2 quạt

// Ngưỡng MQ2 (LPG/Gas)
const float MQ2_RATIO_SAFE = 0.95;      // An toàn: ratio >= 0.95
const float MQ2_RATIO_MEDIUM = 0.85;    // Trung bình: 0.85 <= ratio < 0.95
const float MQ2_RATIO_DANGER = 0.75;    // Nguy hiểm: ratio < 0.75
const float MQ2_PPM_MEDIUM = 100.0;       // Trung bình: PPM >= 100
const float MQ2_PPM_DANGER = 200.0;      // Nguy hiểm: PPM >= 200
// const int MQ2_ADC_MEDIUM = 500;         // KHÔNG DÙNG - chỉ để tham khảo
// const int MQ2_ADC_DANGER = 800;         // KHÔNG DÙNG - chỉ để tham khảo

// Ngưỡng MQ7 (CO)
const float MQ7_RATIO_SAFE = 0.95;      // An toàn: ratio >= 0.95
const float MQ7_RATIO_MEDIUM = 0.85;    // Trung bình: 0.85 <= ratio < 0.95
const float MQ7_RATIO_DANGER = 0.75;    // Nguy hiểm: ratio < 0.75
const float MQ7_PPM_MEDIUM = 25.0;      // Trung bình: PPM >= 25
const float MQ7_PPM_DANGER = 100.0;     // Nguy hiểm: PPM >= 100
// const int MQ7_ADC_MEDIUM = 400;        // KHÔNG DÙNG - chỉ để tham khảo
// const int MQ7_ADC_DANGER = 600;        // KHÔNG DÙNG - chỉ để tham khảo

// Ngưỡng MQ135 (Air Quality)
const float MQ135_RATIO_SAFE = 0.9;     // An toàn: ratio >= 0.9
const float MQ135_RATIO_MEDIUM = 0.75; // Trung bình: 0.75 <= ratio < 0.9
const float MQ135_RATIO_DANGER = 0.6;   // Nguy hiểm: ratio < 0.6
const float MQ135_PPM_MEDIUM = 700.0;   // Trung bình: PPM >= 800 (tương ứng ratio <= 0.8)
const float MQ135_PPM_DANGER = 1000.0;   // Nguy hiểm: PPM >= 1000 (tương ứng ratio <= 0.7)
// const int MQ135_ADC_MEDIUM = 1300;     // KHÔNG DÙNG - chỉ để tham khảo
// const int MQ135_ADC_DANGER = 1500;     // KHÔNG DÙNG - chỉ để tham khảo

// ================= THÔNG SỐ KHÁC =================
const float VCC = 5.0;
const float RL = 10.0;
const int ADC_RESOLUTION = 4096;
const float ADC_VREF = 3.3;

// Biến lưu R0 đã calibrate (tính từ giá trị ban đầu)
float MQ2_R0 = 0;
float MQ7_R0 = 0;
float MQ135_R0 = 0;
bool calibrated = false;

// Biến điều khiển quạt từ server (override)
bool manualControl = false;  // true = điều khiển thủ công từ server, false = tự động
bool manualFan1State = false; // Trạng thái quạt 1 khi điều khiển thủ công
bool manualFan2State = false; // Trạng thái quạt 2 khi điều khiển thủ công
unsigned long manualControlTimeout = 0; // Thời gian hết hạn điều khiển thủ công (0 = không giới hạn)
const unsigned long MANUAL_CONTROL_DURATION = 300000; // 5 phút (300000ms) - tự động quay lại chế độ tự động

// ================= ĐẾM THỜI GIAN HOẠT ĐỘNG QUẠT =================
unsigned long fan1StartTime = 0;      // Thời điểm quạt 1 bật
unsigned long fan2StartTime = 0;      // Thời điểm quạt 2 bật
unsigned long fan1TotalRuntime = 0;   // Tổng thời gian quạt 1 đã chạy (ms)
unsigned long fan2TotalRuntime = 0;   // Tổng thời gian quạt 2 đã chạy (ms)
bool fan1WasOn = false;               // Trạng thái quạt 1 ở lần loop trước
bool fan2WasOn = false;               // Trạng thái quạt 2 ở lần loop trước

// Thông số MQ135 (Air Quality - CO2)
// Công thức: PPM = a * (Rs/R0)^b
// Khi ratio = 1.0 (không khí sạch), PPM ≈ 400 (CO2 trong không khí bình thường)
const float MQ135_PARA = 116.6020682;
const float MQ135_PARB = -2.769034857;

// Thông số MQ2 (LPG, Propane, Hydrogen)
// Công thức: PPM = a * (Rs/R0)^b
// Khi ratio = 1.0 (không khí sạch), PPM phải ≈ 0
// Sử dụng công thức: PPM = a * (R0/Rs)^b - khi có khí, Rs giảm, R0/Rs tăng, PPM tăng
const float MQ2_PARA = 1000.0;  // Hệ số điều chỉnh
const float MQ2_PARB = -2.3;     // Exponent

// Thông số MQ7 (Carbon Monoxide)
// Công thức tương tự MQ2
const float MQ7_PARA = 100.0;
const float MQ7_PARB = -1.518;

// ================= HÀM XỬ LÝ =================
int readMQ(int pin)
{
  long total = 0;
  for (int i = 0; i < 10; i++)
  {
    total += analogRead(pin);
    delay(5);
  }
  return total / 10;
}

// Tính điện trở Rs từ giá trị ADC
float calculateRs(int adcValue)
{
  if (adcValue <= 10)
    return 999999.0;
  float voltage = ((float)adcValue / (float)ADC_RESOLUTION) * ADC_VREF;
  if (voltage < 0.1)
    return 999999.0;
  return ((VCC / voltage) - 1.0) * RL;
}

// Tính PPM cho MQ135 (Air Quality - CO2)
// Công thức đơn giản: PPM dựa trên ratio
// MQ135 đo nhiều loại khí, nên giá trị PPM có thể cao hơn
float calculateMQ135PPM(float rs, float r0)
{
  if (rs <= 0 || r0 <= 0 || r0 < 1.0)
    return 0.0;
  float ratio = rs / r0;
  if (ratio <= 0)
    return 0.0;
  
  // Khi ratio = 1.0 → PPM ≈ 400 (CO2 trong không khí bình thường)
  // Khi ratio < 1.0 → có khí độc, PPM tăng
  // Khi ratio > 1.0 → không khí tốt hơn, PPM giảm
  
  float base_ppm = 400.0; // CO2 trong không khí bình thường
  
  if (ratio < 1.0) {
    // Có khí độc, PPM tăng - giảm hệ số từ 2000 xuống 1500
    float ppm = base_ppm + (1.0 - ratio) * 1500.0;
    return ppm;
  } else {
    // Không khí tốt, PPM giảm từ base - giảm hệ số scale
    float ppm = base_ppm * (0.8 + ratio * 0.2); // Scale nhẹ hơn
    if (ppm < 250) ppm = 250; // Giới hạn tối thiểu (giảm từ 300)
    return ppm;
  }
}

// Tính PPM cho MQ2 (LPG)
// Công thức đơn giản: PPM dựa trên sự thay đổi ratio
// Khi ratio = 1.0 (không khí sạch), PPM = 0
// Khi ratio giảm (có khí), PPM tăng
float calculateMQ2PPM(float rs, float r0)
{
  if (rs <= 0 || r0 <= 0 || r0 < 1.0 || rs < 1.0)
    return 0.0;
  float ratio = rs / r0;  // Rs/R0
  if (ratio <= 0)
    return 0.0;
  
  // Khi ratio = 1.0 → PPM = 0 (không khí sạch)
  // Khi ratio < 1.0 → có khí, tính PPM
  // Công thức đơn giản: PPM = k * (1 - ratio) * scale_factor
  if (ratio >= 1.0) {
    return 0.0; // Không khí sạch
  }
  
  // Khi ratio giảm, PPM tăng
  // ratio = 0.5 → PPM cao, ratio = 0.9 → PPM thấp
  float ppm = (1.0 - ratio) * 1000.0; // Scale factor có thể điều chỉnh
  return ppm;
}

// Tính PPM cho MQ7 (CO)
// Công thức đơn giản tương tự MQ2
float calculateMQ7PPM(float rs, float r0)
{
  if (rs <= 0 || r0 <= 0 || r0 < 1.0 || rs < 1.0)
    return 0.0;
  float ratio = rs / r0;  // Rs/R0
  if (ratio <= 0)
    return 0.0;
  
  // Khi ratio = 1.0 → PPM = 0 (không khí sạch)
  if (ratio >= 1.0) {
    return 0.0;
  }
  
  // Khi ratio giảm, PPM tăng
  float ppm = (1.0 - ratio) * 500.0; // Scale factor cho CO (thấp hơn MQ2)
  return ppm;
}

// Callback khi nhận message từ MQTT
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Chuyển payload thành string
  char message[256];
  for (int i = 0; i < length && i < 255; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';
  
  Serial.println("Received MQTT message on topic: " + String(topic));
  Serial.println("Message: " + String(message));
  
  String command = String(message);
  command.trim();
  
  // Parse JSON command: {"cmd":"fan_off"} hoặc {"cmd":"fan_on","fan1":1,"fan2":0} hoặc {"cmd":"auto"}
  if (command.indexOf("\"cmd\":\"fan_off\"") >= 0 || command.indexOf("\"cmd\":\"fans_off\"") >= 0) {
    // Lệnh tắt tất cả quạt
    manualControl = true;
    manualFan1State = false;
    manualFan2State = false;
    manualControlTimeout = millis() + MANUAL_CONTROL_DURATION;
    Serial.println("✓ Manual control: ALL FANS OFF");
  }
  else if (command.indexOf("\"cmd\":\"auto\"") >= 0 || command.indexOf("\"cmd\":\"automatic\"") >= 0) {
    // Lệnh quay lại chế độ tự động
    manualControl = false;
    manualControlTimeout = 0;
    Serial.println("✓ Switched to AUTO mode");
  }
  else if (command.indexOf("\"cmd\":\"fan_on\"") >= 0) {
    // Lệnh bật quạt theo chỉ định
    manualControl = true;
    manualControlTimeout = millis() + MANUAL_CONTROL_DURATION;
    
    // Parse fan1 và fan2 từ JSON
    if (command.indexOf("\"fan1\":1") >= 0) {
      manualFan1State = true;
    } else if (command.indexOf("\"fan1\":0") >= 0) {
      manualFan1State = false;
    }
    
    if (command.indexOf("\"fan2\":1") >= 0) {
      manualFan2State = true;
    } else if (command.indexOf("\"fan2\":0") >= 0) {
      manualFan2State = false;
    }
    
    Serial.printf("✓ Manual control: FAN1=%s FAN2=%s\n", 
                  manualFan1State ? "ON" : "OFF",
                  manualFan2State ? "ON" : "OFF");
  }
}

// Kết nối lại MQTT nếu mất kết nối
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Thử kết nối với client ID
    if (mqttClient.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected!");
      
      // Subscribe topic để nhận lệnh điều khiển
      if (mqttClient.subscribe(topic_device_control)) {
        Serial.println("✓ Subscribed to: " + String(topic_device_control));
      } else {
        Serial.println("✗ Failed to subscribe");
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// Calibrate R0 từ giá trị ADC trong không khí sạch (chạy khi khởi động)
void calibrateSensors()
{
  Serial.println("\n=== Calibrating sensors (clean air) ===");
  Serial.println("Please wait 20 seconds for calibration...");

  long mq2_sum = 0, mq7_sum = 0, mq135_sum = 0;
  int samples = 50; // Lấy 50 mẫu để tính trung bình

  for (int i = 0; i < samples; i++)
  {
    mq2_sum += analogRead(MQ2_PIN);
    mq7_sum += analogRead(MQ7_PIN);
    mq135_sum += analogRead(MQ135_PIN);
    delay(400);
    if (i % 10 == 0)
      Serial.print(".");
  }
  Serial.println();

  // Tính R0 từ giá trị ADC trung bình
  int mq2_avg = mq2_sum / samples;
  int mq7_avg = mq7_sum / samples;
  int mq135_avg = mq135_sum / samples;

  MQ2_R0 = calculateRs(mq2_avg);
  MQ7_R0 = calculateRs(mq7_avg);
  MQ135_R0 = calculateRs(mq135_avg);

  Serial.printf("Calibration complete:\n");
  Serial.printf("  MQ2_R0: %.2f kOhm (from ADC: %d)\n", MQ2_R0 / 1000.0, mq2_avg);
  Serial.printf("  MQ7_R0: %.2f kOhm (from ADC: %d)\n", MQ7_R0 / 1000.0, mq7_avg);
  Serial.printf("  MQ135_R0: %.2f kOhm (from ADC: %d)\n", MQ135_R0 / 1000.0, mq135_avg);
  Serial.println("=== Starting measurements ===\n");

  calibrated = true;
}

// ================= SETUP =================
void setup()
{
  Serial.begin(115200);
  delay(500);

  // Cấu hình Relay: Luôn set trạng thái OFF trước khi pinMode để tránh giật khi khởi động
  digitalWrite(RELAY_PIN_1, RELAY_OFF);
  digitalWrite(RELAY_PIN_2, RELAY_OFF);
  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);

  // Cấu hình ADC
  analogSetPinAttenuation(MQ135_PIN, ADC_11db);
  analogSetPinAttenuation(MQ7_PIN, ADC_11db);
  analogSetPinAttenuation(MQ2_PIN, ADC_11db);
  analogReadResolution(12);

  // Kết nối WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting Wifi");

  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 20)
  {
    delay(500);
    Serial.print(".");
    t++;
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
    Serial.println("Subnet: " + WiFi.subnetMask().toString());
    Serial.println("Gateway: " + WiFi.gatewayIP().toString());
    
    // Cấu hình MQTT
    // Nếu dùng TLS (port 8883), bỏ qua certificate verification (chỉ dùng cho development)
    // Trong production, nên dùng certificate thật
    espClient.setInsecure(); // Bỏ qua SSL certificate verification
    
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqttCallback);
    mqttClient.setBufferSize(1024); // Tăng buffer size cho message lớn
    
    Serial.println("MQTT Server: " + String(mqtt_server) + ":" + String(mqtt_port));
    Serial.println("MQTT Client ID: " + String(mqtt_client_id));
    
    // Kết nối MQTT
    reconnectMQTT();
  }
  else
  {
    Serial.println("\nWiFi Failed.");
  }

  // Calibrate sensors sau khi WiFi kết nối
  delay(2000);
  calibrateSensors();
}

// ================= LOOP =================
void loop()
{
  // Chờ calibrate xong
  if (!calibrated)
  {
    delay(1000);
    return;
  }
  // 1. Đọc cảm biến (ADC values)
  int mq2_adc = readMQ(MQ2_PIN);
  int mq7_adc = readMQ(MQ7_PIN);
  int mq135_adc = readMQ(MQ135_PIN);

  // 2. Tính toán điện trở Rs cho từng cảm biến
  float mq2_rs = calculateRs(mq2_adc);
  float mq7_rs = calculateRs(mq7_adc);
  float mq135_rs = calculateRs(mq135_adc);

  // 3. Tính toán PPM cho từng cảm biến (chỉ tính nếu R0 đã calibrate)
  float mq2_ppm = 0.0, mq7_ppm = 0.0, mq135_ppm = 0.0;
  float mq2_ratio = 0.0, mq7_ratio = 0.0, mq135_ratio = 0.0;

  if (MQ2_R0 > 0)
  {
    mq2_ratio = mq2_rs / MQ2_R0;
    mq2_ppm = calculateMQ2PPM(mq2_rs, MQ2_R0);
  }
  if (MQ7_R0 > 0)
  {
    mq7_ratio = mq7_rs / MQ7_R0;
    mq7_ppm = calculateMQ7PPM(mq7_rs, MQ7_R0);
  }
  if (MQ135_R0 > 0)
  {
    mq135_ratio = mq135_rs / MQ135_R0;
    mq135_ppm = calculateMQ135PPM(mq135_rs, MQ135_R0);
  }

  // 4. Logic điều khiển 2 Quạt với 3 mức nguy hiểm
  // Mức 0: AN TOÀN - Tắt cả 2 quạt
  // Mức 1: TRUNG BÌNH - Bật 1 quạt
  // Mức 2: NGUY HIỂM - Bật cả 2 quạt
  
  int dangerLevel = 0; // 0 = An toàn, 1 = Trung bình, 2 = Nguy hiểm
  String reason = "";
  
  // Đánh giá từng cảm biến
  int mq2_level = 0, mq7_level = 0, mq135_level = 0;
  
  // Đánh giá MQ2 - CHỈ DÙNG PPM và RATIO
  if (mq2_ratio > 0 && (mq2_ratio < MQ2_RATIO_DANGER || mq2_ppm >= MQ2_PPM_DANGER)) {
    mq2_level = 2; // Nguy hiểm
  } else if (mq2_ratio > 0 && (mq2_ratio < MQ2_RATIO_MEDIUM || mq2_ppm >= MQ2_PPM_MEDIUM)) {
    mq2_level = 1; // Trung bình
  }
  
  // Đánh giá MQ7 - CHỈ DÙNG PPM và RATIO
  if (mq7_ratio > 0 && (mq7_ratio < MQ7_RATIO_DANGER || mq7_ppm >= MQ7_PPM_DANGER)) {
    mq7_level = 2; // Nguy hiểm
  } else if (mq7_ratio > 0 && (mq7_ratio < MQ7_RATIO_MEDIUM || mq7_ppm >= MQ7_PPM_MEDIUM)) {
    mq7_level = 1; // Trung bình
  }
  
  // Đánh giá MQ135 - CHỈ DÙNG PPM và RATIO
  if (mq135_ratio > 0 && (mq135_ratio < MQ135_RATIO_DANGER || mq135_ppm >= MQ135_PPM_DANGER)) {
    mq135_level = 2; // Nguy hiểm
  } else if (mq135_ratio > 0 && (mq135_ratio < MQ135_RATIO_MEDIUM || mq135_ppm >= MQ135_PPM_MEDIUM)) {
    mq135_level = 1; // Trung bình
  }
  
  // Xác định mức nguy hiểm tổng thể
  int maxLevel = max(mq2_level, max(mq7_level, mq135_level));
  int dangerCount = 0;
  if (mq2_level == 2) dangerCount++;
  if (mq7_level == 2) dangerCount++;
  if (mq135_level == 2) dangerCount++;
  
  // Logic quyết định:
  // - Nếu có >= 2 cảm biến ở mức nguy hiểm → Mức 2 (Bật cả 2 quạt)
  // - Nếu có >= 1 cảm biến ở mức nguy hiểm → Mức 2 (Bật cả 2 quạt)
  // - Nếu có >= 2 cảm biến ở mức trung bình → Mức 1 (Bật 1 quạt)
  // - Nếu có >= 1 cảm biến ở mức trung bình → Mức 1 (Bật 1 quạt)
  // - Còn lại → Mức 0 (Tắt cả 2 quạt)
  
  if (dangerCount >= 1 || maxLevel == 2) {
    dangerLevel = 2; // Nguy hiểm - Bật cả 2 quạt
    if (mq2_level == 2) reason += "MQ2_DANGER ";
    if (mq7_level == 2) reason += "MQ7_DANGER ";
    if (mq135_level == 2) reason += "MQ135_DANGER ";
  } else if (maxLevel == 1 || (mq2_level == 1 && mq7_level == 1) || (mq2_level == 1 && mq135_level == 1) || (mq7_level == 1 && mq135_level == 1)) {
    dangerLevel = 1; // Trung bình - Bật 1 quạt
    if (mq2_level == 1) reason += "MQ2_MEDIUM ";
    if (mq7_level == 1) reason += "MQ7_MEDIUM ";
    if (mq135_level == 1) reason += "MQ135_MEDIUM ";
  } else {
    dangerLevel = 0; // An toàn - Tắt cả 2 quạt
    reason = "SAFE";
  }
  
  // Kiểm tra timeout điều khiển thủ công
  if (manualControl && manualControlTimeout > 0 && millis() > manualControlTimeout) {
    manualControl = false;
    manualControlTimeout = 0;
    Serial.println("⏰ Manual control timeout - Switching to AUTO mode");
  }
  
  // Điều khiển phần cứng
  bool currentFan1State = false;
  bool currentFan2State = false;
  
  if (manualControl) {
    // Chế độ điều khiển thủ công từ server
    currentFan1State = manualFan1State;
    currentFan2State = manualFan2State;
    digitalWrite(RELAY_PIN_1, currentFan1State ? RELAY_ON : RELAY_OFF);
    digitalWrite(RELAY_PIN_2, currentFan2State ? RELAY_ON : RELAY_OFF);
  } else {
    // Chế độ tự động dựa trên cảm biến
    if (dangerLevel == 2) {
      // Nguy hiểm: Bật cả 2 quạt
      currentFan1State = true;
      currentFan2State = true;
      digitalWrite(RELAY_PIN_1, RELAY_ON);
      digitalWrite(RELAY_PIN_2, RELAY_ON);
    } else if (dangerLevel == 1) {
      // Trung bình: Bật 1 quạt (quạt 1)
      currentFan1State = true;
      currentFan2State = false;
      digitalWrite(RELAY_PIN_1, RELAY_ON);
      digitalWrite(RELAY_PIN_2, RELAY_OFF);
    } else {
      // An toàn: Tắt cả 2 quạt
      currentFan1State = false;
      currentFan2State = false;
      digitalWrite(RELAY_PIN_1, RELAY_OFF);
      digitalWrite(RELAY_PIN_2, RELAY_OFF);
    }
  }

  // ================= ĐẾM THỜI GIAN HOẠT ĐỘNG QUẠT =================
  unsigned long currentTime = millis();
  
  // Xử lý quạt 1
  if (currentFan1State && !fan1WasOn) {
    // Quạt 1 vừa bật
    fan1StartTime = currentTime;
    fan1WasOn = true;
    Serial.println("🔄 Fan 1: ON - Bắt đầu đếm thời gian");
  } else if (!currentFan1State && fan1WasOn) {
    // Quạt 1 vừa tắt
    unsigned long runtime = currentTime - fan1StartTime;
    fan1TotalRuntime += runtime;
    fan1WasOn = false;
    Serial.printf("⏱️ Fan 1: OFF - Đã chạy: %lu ms (Tổng: %lu ms = %.2f giờ)\n", 
                  runtime, fan1TotalRuntime, fan1TotalRuntime / 3600000.0);
  }
  
  // Xử lý quạt 2
  if (currentFan2State && !fan2WasOn) {
    // Quạt 2 vừa bật
    fan2StartTime = currentTime;
    fan2WasOn = true;
    Serial.println("🔄 Fan 2: ON - Bắt đầu đếm thời gian");
  } else if (!currentFan2State && fan2WasOn) {
    // Quạt 2 vừa tắt
    unsigned long runtime = currentTime - fan2StartTime;
    fan2TotalRuntime += runtime;
    fan2WasOn = false;
    Serial.printf("⏱️ Fan 2: OFF - Đã chạy: %lu ms (Tổng: %lu ms = %.2f giờ)\n", 
                  runtime, fan2TotalRuntime, fan2TotalRuntime / 3600000.0);
  }
  
  // Tính thời gian chạy hiện tại (nếu đang chạy)
  unsigned long fan1CurrentRuntime = 0;
  unsigned long fan2CurrentRuntime = 0;
  if (currentFan1State && fan1WasOn) {
    fan1CurrentRuntime = currentTime - fan1StartTime;
  }
  if (currentFan2State && fan2WasOn) {
    fan2CurrentRuntime = currentTime - fan2StartTime;
  }

  // 5. Hiển thị & Gửi dữ liệu
  static int counter = 0;

  // In Serial Monitor
  String fanStatus = "";
  if (dangerLevel == 2) {
    fanStatus = "2 FANS ON";
  } else if (dangerLevel == 1) {
    fanStatus = "1 FAN ON";
  } else {
    fanStatus = "OFF";
  }
  
  String modeStr = manualControl ? "MANUAL" : "AUTO";
  Serial.printf("Cnt:%d | MQ2:ADC=%d Ratio=%.2f PPM=%.2f | MQ7:ADC=%d Ratio=%.2f PPM=%.2f | MQ135:ADC=%d Ratio=%.2f PPM=%.2f | MODE:%s LEVEL:%d FANS:%s (%s)\n",
                counter,
                mq2_adc, mq2_ratio, mq2_ppm,
                mq7_adc, mq7_ratio, mq7_ppm,
                mq135_adc, mq135_ratio, mq135_ppm,
                modeStr.c_str(), dangerLevel, fanStatus.c_str(), reason.c_str());

  // Duy trì kết nối MQTT và xử lý messages
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop(); // Xử lý MQTT messages
    
    // Gửi dữ liệu cảm biến qua MQTT
    // Tạo JSON message với đầy đủ dữ liệu cảm biến
    String msg = "{";
    msg += "\"cnt\":" + String(counter) + ",";
    msg += "\"device_id\":\"" + String(mqtt_client_id) + "\",";
    msg += "\"mq2\":{";
    msg += "\"adc\":" + String(mq2_adc) + ",";
    msg += "\"ratio\":" + String(mq2_ratio, 3) + ",";
    msg += "\"ppm\":" + String(mq2_ppm, 2);
    msg += "},";
    msg += "\"mq7\":{";
    msg += "\"adc\":" + String(mq7_adc) + ",";
    msg += "\"ratio\":" + String(mq7_ratio, 3) + ",";
    msg += "\"ppm\":" + String(mq7_ppm, 2);
    msg += "},";
    msg += "\"mq135\":{";
    msg += "\"adc\":" + String(mq135_adc) + ",";
    msg += "\"ratio\":" + String(mq135_ratio, 3) + ",";
    msg += "\"ppm\":" + String(mq135_ppm, 2);
    msg += "},";
    msg += "\"danger_level\":" + String(dangerLevel) + ","; // 0 = An toàn, 1 = Trung bình, 2 = Nguy hiểm
    // Trạng thái quạt thực tế - dùng cùng biến với logic đếm thời gian
    msg += "\"fan1\":" + String(currentFan1State ? 1 : 0) + ",";
    msg += "\"fan2\":" + String(currentFan2State ? 1 : 0) + ",";
    msg += "\"manual_control\":" + String(manualControl ? 1 : 0) + ","; // 1 = Thủ công, 0 = Tự động
    msg += "\"fan_status\":\"";
    if (manualControl) {
      // Hiển thị trạng thái thủ công
      if (currentFan1State && currentFan2State) {
        msg += "MANUAL_2_FANS_ON";
      } else if (currentFan1State) {
        msg += "MANUAL_1_FAN_ON";
      } else {
        msg += "MANUAL_OFF";
      }
    } else {
      // Hiển thị trạng thái tự động
      if (currentFan1State && currentFan2State) {
        msg += "AUTO_2_FANS_ON";
      } else if (currentFan1State) {
        msg += "AUTO_1_FAN_ON";
      } else {
        msg += "AUTO_OFF";
      }
    }
    msg += "\",";
    msg += "\"reason\":\"" + reason + "\",";
    msg += "\"timestamp\":" + String(millis()) + ",";
    // Thêm thời gian hoạt động quạt
    msg += "\"fan_runtime\":{";
    msg += "\"fan1_total_ms\":" + String(fan1TotalRuntime) + ",";
    msg += "\"fan1_current_ms\":" + String(fan1CurrentRuntime) + ",";
    msg += "\"fan2_total_ms\":" + String(fan2TotalRuntime) + ",";
    msg += "\"fan2_current_ms\":" + String(fan2CurrentRuntime);
    msg += "}";
    msg += "}";

    // Publish lên MQTT
    if (mqttClient.publish(topic_sensor_data, msg.c_str())) {
      Serial.println("✓ MQTT Published: " + msg);
    } else {
      Serial.println("✗ MQTT Publish FAILED");
    }
    
    counter++;
  }
  else
  {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    delay(1000);
  }

  delay(2000); // Đọc cảm biến mỗi 2 giây
}