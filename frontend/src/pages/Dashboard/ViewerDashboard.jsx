import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, Wifi, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ViewerDashboard = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  // Mock data
  const [sensorData, setSensorData] = useState({
    mq2: 0.00,
    mq7: 0.00,
    mq135: 0.00,
    isSafe: true,
    safetyLevel: 'safe' // safe, medium, dangerous
  });

  const getAdvice = (level) => {
    switch(level) {
      case 'safe':
        return {
          message: "Chất lượng không khí đang ở mức tốt.",
          advice: "Bạn có thể yên tâm gửi xe và di chuyển trong hầm.",
          variant: "default",
          color: "text-green-500",
          borderColor: "border-green-500"
        };
      case 'medium':
        return {
          message: "Chất lượng không khí ở mức trung bình.",
          advice: "Nên hạn chế ở lại lâu trong hầm gửi xe nếu không cần thiết.",
          variant: "warning", 
          color: "text-yellow-500",
          borderColor: "border-yellow-500"
        };
      case 'dangerous':
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
        <Card className={`${sensorData.isSafe ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Mức độ an toàn</h3>
            <div className={`text-5xl font-bold mb-2 ${sensorData.isSafe ? 'text-green-500' : 'text-red-500'}`}>
              {sensorData.isSafe ? '0' : '1'}
            </div>
            <Badge variant={sensorData.isSafe ? "outline" : "destructive"} className={sensorData.isSafe ? "text-green-500 border-green-500" : ""}>
              {sensorData.isSafe ? "AN TOÀN" : "NGUY HIỂM"}
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
          { label: "Nồng độ khí Gas/LPG", value: sensorData.mq2, unit: "PPM", color: "text-blue-500" },
          { label: "Nồng độ khí CO", value: sensorData.mq7, unit: "PPM", color: "text-orange-500" },
          { label: "Chất lượng không khí", value: sensorData.mq135, unit: "PPM", color: "text-green-500" }
        ].map((sensor, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{sensor.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                {/* Placeholder for Gauge - using simple circle for now */}
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-muted mb-4">
                   <div className={`text-2xl font-bold ${sensor.color}`}>
                     {sensor.value.toFixed(2)}
                   </div>
                   <span className="absolute bottom-6 text-xs text-muted-foreground">{sensor.unit}</span>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500">BÌNH THƯỜNG</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewerDashboard;

