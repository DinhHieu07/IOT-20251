import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Activity, Fan, AlertTriangle, CheckCircle2, Power, Wifi, Zap, ZapOff, Settings } from 'lucide-react';
import PPMGauge from '../../components/ui/PPMGauge';
import useWindowWidth from '../../hooks/useWindowWidth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { deviceService } from '../../services/deviceService';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  mq2: {
    label: "MQ2 (LPG)",
    color: "#3b82f6",
  },
  mq7: {
    label: "MQ7 (CO)",
    color: "#f97316",
  },
  mq135: {
    label: "MQ135 (Air Quality)",
    color: "#6b7280",
  },
}

const AdminDashboard = () => {
  const { isConnected: isSocketConnected, lastMessage } = useWebSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [fan1Status, setFan1Status] = useState(false);
  const [fan2Status, setFan2Status] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [isControlling, setIsControlling] = useState(false);
  const width = useWindowWidth();
  const gaugeSize = width < 750 ? 120 : width < 1150 ? 140 : 160;
  
  // Mock data
  const [sensorData, setSensorData] = useState({
    mq2: 0,
    mq7: 0,
    mq135: 0,
    safetyLevel: 1 // 1: Safe, 2: Warning, 3: Danger
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setIsConnected(isSocketConnected);
  }, [isSocketConnected]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.deviceId) {
        setCurrentDeviceId(lastMessage.deviceId);
      }

      if (lastMessage.data) {
        const { values, systemStatus, timestamp } = lastMessage.data;
        
        // Update sensor data
        setSensorData({
          mq2: values.mq2,
          mq7: values.mq7,
          mq135: values.mq135,
          safetyLevel: systemStatus.safetyLevel || 1
        });

        // Update fan status
        setFan1Status(systemStatus.fan1Status);
        setFan2Status(systemStatus.fan2Status);

        // Update chart data
        const timeStr = new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setChartData(prev => {
          const newData = [...prev, {
            time: timeStr,
            mq2: values.mq2,
            mq7: values.mq7,
            mq135: values.mq135
          }];
          // Keep last 20 points
          return newData.slice(-20);
        });
      }
    }
  }, [lastMessage]);

  const handleControl = async (command, f1 = false, f2 = false) => {
    if (!currentDeviceId) return;
    setIsControlling(true);
    try {
      await deviceService.control(currentDeviceId, command, f1, f2);
    } catch (error) {
      console.error("Control error:", error);
    } finally {
      setIsControlling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">Hệ thống Quạt Thông gió Tự động</h1>
        <p className="text-muted-foreground text-sm">Giám sát chất lượng không khí hầm gửi xe</p>
        <Badge variant={isConnected ? "default" : "destructive"} className="mt-2">
          {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
          {isConnected ? "Đang kết nối" : "Mất kết nối"}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Safety Status */}
        <Card className={`${
          sensorData.safetyLevel === 1 ? 'bg-green-500/10 border-green-500/50' : 
          sensorData.safetyLevel === 2 ? 'bg-yellow-500/10 border-yellow-500/50' : 
          'bg-red-500/10 border-red-500/50'
        } flex flex-col justify-center`}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h3 className="text-xl font-bold text-muted-foreground uppercase mb-4">Mức nguy hiểm</h3>
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

        {/* Fan Control & Status (Merged) */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Điều khiển & Trạng thái Quạt</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Status Section */}
              <div className="flex flex-col items-center justify-center min-w-[150px]">
                <div className="text-5xl font-bold mb-2 text-muted-foreground">
                  {fan1Status || fan2Status ? "ON" : "OFF"}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {fan1Status || fan2Status ? "Hệ thống đang hoạt động" : "Hệ thống đang chờ..."}
                </p>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-24 bg-border"></div>

              {/* Controls Section */}
              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                {/* Fan 1 Control */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Fan className={`w-5 h-5 ${fan1Status ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Quạt 1</span>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button 
                      size="sm" 
                      variant={fan1Status ? "default" : "outline"} 
                      className="flex-1"
                      onClick={() => handleControl('fan_on', true, fan2Status)}
                      disabled={isControlling || !currentDeviceId}
                    >
                      Bật
                    </Button>
                    <Button 
                      size="sm" 
                      variant={!fan1Status ? "secondary" : "outline"} 
                      className="flex-1"
                      onClick={() => handleControl('fan_on', false, fan2Status)}
                      disabled={isControlling || !currentDeviceId}
                    >
                      Tắt
                    </Button>
                  </div>
                </div>

                {/* Fan 2 Control */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Fan className={`w-5 h-5 ${fan2Status ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Quạt 2</span>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button 
                      size="sm" 
                      variant={fan2Status ? "default" : "outline"} 
                      className="flex-1"
                      onClick={() => handleControl('fan_on', fan1Status, true)}
                      disabled={isControlling || !currentDeviceId}
                    >
                      Bật
                    </Button>
                    <Button 
                      size="sm" 
                      variant={!fan2Status ? "secondary" : "outline"} 
                      className="flex-1"
                      onClick={() => handleControl('fan_on', fan1Status, false)}
                      disabled={isControlling || !currentDeviceId}
                    >
                      Tắt
                    </Button>
                  </div>
                </div>

                {/* Global Controls */}
                <div className="col-span-2 flex gap-3 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 border-primary/50 hover:bg-primary/10"
                    onClick={() => handleControl('auto')}
                    disabled={isControlling || !currentDeviceId}
                  >
                    <Settings className="w-4 h-4" />
                    Chế độ Tự động
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 gap-2"
                    onClick={() => handleControl('fan_off')}
                    disabled={isControlling || !currentDeviceId}
                  >
                    <Power className="w-4 h-4" />
                    Tắt tất cả
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Data Cards */}
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

      {/* Chart Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* MQ2 Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ MQ2 (LPG)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ReferenceLine y={400} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={800} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="mq2" stroke="var(--color-mq2)" fill="var(--color-mq2)" fillOpacity={0.4} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* MQ7 Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ MQ7 (CO)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ReferenceLine y={30} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={60} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="mq7" stroke="var(--color-mq7)" fill="var(--color-mq7)" fillOpacity={0.4} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* MQ135 Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ MQ135 (Air Quality)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ReferenceLine y={70} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={120} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="mq135" stroke="var(--color-mq135)" fill="var(--color-mq135)" fillOpacity={0.4} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu trung bình</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="24h" className="w-full">
            <div className="flex justify-end mb-4">
              <TabsList>
                <TabsTrigger value="24h">24 Giờ</TabsTrigger>
                <TabsTrigger value="7days">7 Ngày</TabsTrigger>
                <TabsTrigger value="30days">30 Ngày</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="24h" className="flex items-center justify-center h-32 text-muted-foreground">
              Không có dữ liệu trong khoảng thời gian này
            </TabsContent>
            <TabsContent value="7days" className="flex items-center justify-center h-32 text-muted-foreground">
              Không có dữ liệu trong khoảng thời gian này
            </TabsContent>
            <TabsContent value="30days" className="flex items-center justify-center h-32 text-muted-foreground">
              Không có dữ liệu trong khoảng thời gian này
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Trung bình MQ2", value: "--" },
          { label: "Trung bình MQ7", value: "--" },
          { label: "Trung bình MQ135", value: "--" },
          { label: "Tỷ lệ Quạt 1", value: "--" },
          { label: "Tỷ lệ Quạt 2", value: "--" },
        ].map((stat, index) => (
          <Card key={index} className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-xs text-muted-foreground pb-4">
        Cập nhật lần cuối: {new Date().toLocaleTimeString()} {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default AdminDashboard;
