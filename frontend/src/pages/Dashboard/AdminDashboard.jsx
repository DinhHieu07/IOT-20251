import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Activity, Fan, AlertTriangle, CheckCircle2, Power, Wifi } from 'lucide-react';
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
  const [isConnected, setIsConnected] = useState(true);
  const [fan1Status, setFan1Status] = useState(false);
  const [fan2Status, setFan2Status] = useState(false);
  
  // Mock data
  const [sensorData, setSensorData] = useState({
    mq2: 450.00,
    mq7: 15.00,
    mq135: 65.00,
    isSafe: true
  });

  const [chartData, setChartData] = useState([
    { time: '10:00', mq2: 400, mq7: 12, mq135: 60 },
    { time: '10:05', mq2: 420, mq7: 14, mq135: 62 },
    { time: '10:10', mq2: 410, mq7: 13, mq135: 61 },
    { time: '10:15', mq2: 450, mq7: 15, mq135: 65 },
    { time: '10:20', mq2: 480, mq7: 18, mq135: 68 },
    { time: '10:25', mq2: 460, mq7: 16, mq135: 66 },
  ]);

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
        <Card className={`${sensorData.isSafe ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Mức nguy hiểm</h3>
            <div className={`text-5xl font-bold mb-2 ${sensorData.isSafe ? 'text-green-500' : 'text-red-500'}`}>
              {sensorData.isSafe ? '0' : '1'}
            </div>
            <Badge variant={sensorData.isSafe ? "outline" : "destructive"} className={sensorData.isSafe ? "text-green-500 border-green-500" : ""}>
              {sensorData.isSafe ? "AN TOÀN" : "NGUY HIỂM"}
            </Badge>
          </CardContent>
        </Card>

        {/* System Fan Status */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Trạng thái quạt</h3>
            <div className="text-5xl font-bold mb-2 text-muted-foreground">
              {fan1Status || fan2Status ? "ON" : "OFF"}
            </div>
            <p className="text-sm text-muted-foreground">
              {fan1Status || fan2Status ? "Hệ thống đang hoạt động" : "Hệ thống đang chờ..."}
            </p>
          </CardContent>
        </Card>

        {/* Individual Fan Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4 text-center">Chi tiết quạt</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2">
                <Fan className={`w-8 h-8 ${fan1Status ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">QUẠT 1</span>
                <Badge variant={fan1Status ? "default" : "secondary"}>{fan1Status ? "BẬT" : "TẮT"}</Badge>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Fan className={`w-8 h-8 ${fan2Status ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">QUẠT 2</span>
                <Badge variant={fan2Status ? "default" : "secondary"}>{fan2Status ? "BẬT" : "TẮT"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "MQ2 - LPG/GAS", value: sensorData.mq2, unit: "PPM", color: "text-blue-500", border: "border-blue-500" },
          { label: "MQ7 - CARBON MONOXIDE", value: sensorData.mq7, unit: "PPM", color: "text-orange-500", border: "border-orange-500" },
          { label: "MQ135 - AIR QUALITY", value: sensorData.mq135, unit: "PPM", color: "text-gray-500", border: "border-gray-500" }
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
                <Badge variant="outline" className={`${sensor.color} ${sensor.border}`}>AN TOÀN</Badge>
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
