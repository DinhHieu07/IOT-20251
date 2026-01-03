import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, Wifi, Info } from 'lucide-react';
import PPMGauge from '../../components/ui/PPMGauge';
import useWindowWidth from '../../hooks/useWindowWidth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useWebSocket } from '../../hooks/useWebSocket';

const ViewerDashboard = () => {
  const { isConnected: isSocketConnected, lastMessage } = useWebSocket();
  const [isConnected, setIsConnected] = useState(false);
  const width = useWindowWidth();
  const gaugeSize = width < 750 ? 120 : width < 1150 ? 140 : 160;
  
  // Mock data
  const [sensorData, setSensorData] = useState({
    mq2: 0.00,
    mq7: 0.00,
    mq135: 0.00,
    safetyLevel: 1 // 1: Safe, 2: Warning, 3: Danger
  });

  useEffect(() => {
    setIsConnected(isSocketConnected);
  }, [isSocketConnected]);

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { values, systemStatus } = lastMessage.data;
      
      // Update sensor data
      setSensorData({
        mq2: values.mq2,
        mq7: values.mq7,
        mq135: values.mq135,
        safetyLevel: systemStatus.safetyLevel || 1
      });
    }
  }, [lastMessage]);

  const getAdvice = (level) => {
    switch(level) {
      case 1: // Safe
        return {
          message: "Chất lượng không khí đang ở mức tốt.",
          advice: "Bạn có thể yên tâm gửi xe và di chuyển trong hầm.",
          variant: "default",
          color: "text-green-500",
          borderColor: "border-green-500"
        };
      case 2: // Warning
        return {
          message: "Chất lượng không khí ở mức trung bình.",
          advice: "Nên hạn chế ở lại lâu trong hầm gửi xe nếu không cần thiết.",
          variant: "warning", 
          color: "text-yellow-500",
          borderColor: "border-yellow-500"
        };
      case 3: // Danger
        return {
          message: "CẢNH BÁO: Chất lượng không khí nguy hiểm!",
          advice: "Vui lòng rời khỏi hầm gửi xe ngay lập tức và tuân theo hướng dẫn của nhân viên.",
          variant: "destructive",
          color: "text-red-500",
          borderColor: "border-red-500"
        };
      default:
        return {
          message: "Đang cập nhật...",
          advice: "Vui lòng chờ trong giây lát.",
          variant: "default",
          color: "text-muted-foreground",
          borderColor: "border-muted"
        };
    }
  };

  const advice = getAdvice(sensorData.safetyLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">Thông tin Hầm Gửi xe</h1>
        <p className="text-muted-foreground text-sm">Cập nhật trạng thái môi trường thời gian thực</p>
        <Badge variant={isConnected ? "default" : "destructive"} className="mt-2">
          {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
          {isConnected ? "Hệ thống trực tuyến" : "Mất kết nối"}
        </Badge>
      </div>

      {/* Notification & Advice */}
      <Alert className={`${advice.borderColor} border-2 bg-card`}>
        <Info className={`h-4 w-4 ${advice.color}`} />
        <AlertTitle className={`${advice.color} font-bold text-lg mb-2`}>
          {advice.message}
        </AlertTitle>
        <AlertDescription className="text-base">
          {advice.advice}
        </AlertDescription>
      </Alert>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Status */}
        <Card className={`${
          sensorData.safetyLevel === 1 ? 'bg-green-500/10 border-green-500/50' : 
          sensorData.safetyLevel === 2 ? 'bg-yellow-500/10 border-yellow-500/50' : 
          'bg-red-500/10 border-red-500/50'
        } flex flex-col justify-center`}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h3 className="text-xl font-bold text-muted-foreground uppercase mb-4">Mức độ an toàn</h3>
            <div className={`text-8xl font-bold mb-4 ${
              sensorData.safetyLevel === 1 ? 'text-green-500' : 
              sensorData.safetyLevel === 2 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {sensorData.safetyLevel === 1 ? '0' : sensorData.safetyLevel === 2 ? '1' : '2'}
            </div>
            <Badge 
              variant="outline" 
              className={`${
                sensorData.safetyLevel === 1 ? "text-green-500 border-green-500" : 
                sensorData.safetyLevel === 2 ? "text-yellow-500 border-yellow-500" : 
                "text-red-500 border-red-500"
              } text-lg px-6 py-2`}
            >
              {sensorData.safetyLevel === 1 ? "AN TOÀN" : sensorData.safetyLevel === 2 ? "KHÔNG AN TOÀN" : "NGUY HIỂM"}
            </Badge>
          </CardContent>
        </Card>

        {/* General Info Card (Placeholder for other info if needed) */}
        <Card>
           <CardContent className="flex flex-col items-center justify-center p-6 h-full">
             <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Thời gian cập nhật</h3>
             <div className="text-2xl font-bold mb-2 text-foreground">
               {new Date().toLocaleTimeString()}
             </div>
             <p className="text-sm text-muted-foreground">
               {new Date().toLocaleDateString()}
             </p>
           </CardContent>
        </Card>
      </div>

      {/* Sensor Data Cards - Renamed */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Thông số môi trường</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "MQ2 - LPG/GAS", value: sensorData.mq2, unit: "PPM", max: 1000, medium: 400, danger: 800 },
          { label: "MQ7 - CARBON MONOXIDE", value: sensorData.mq7, unit: "PPM", max: 100, medium: 30, danger: 60 },
          { label: "MQ135 - AIR QUALITY", value: sensorData.mq135, unit: "PPM", max: 200, medium: 70, danger: 120 }
        ].map((sensor, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{sensor.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <PPMGauge
                  value={sensor.value}
                  max={sensor.max}
                  mediumThreshold={sensor.medium}
                  dangerThreshold={sensor.danger}
                  unit={sensor.unit}
                  size={gaugeSize}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewerDashboard;

