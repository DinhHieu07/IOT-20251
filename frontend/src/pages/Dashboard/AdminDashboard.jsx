import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Activity, Fan, AlertTriangle, CheckCircle2, Power, Wifi, Zap, ZapOff, Settings, RefreshCw, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import PPMGauge from '../../components/ui/PPMGauge';
import useWindowWidth from '../../hooks/useWindowWidth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { deviceService } from '../../services/deviceService';
import { sensorDataService } from '../../services/sensorDataService';
import { useQuery } from 'react-query';
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
  // Handler để hiển thị toast khi nhận alert
  const handleAlert = (alertData) => {
    const { alert, deviceName, sensorType } = alertData;
    
    if (!alert) return;

    const alertType = alert.type;
    const isDanger = alertType === 'DANGER';
    const isWarning = alertType === 'WARNING';

    toast.error(isDanger ? 'Cảnh báo nguy hiểm!' : 'Cảnh báo!', {
      description: alert.message || `${sensorType} tại ${deviceName} đã vượt ngưỡng`,
      duration: 5000,
      icon: isDanger ? <XCircle className="h-5 w-5 text-red-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      action: {
        label: 'Xem chi tiết',
        onClick: () => {
          // Có thể navigate đến trang alert history
          window.location.href = '/alert-history';
        },
      },
    });
  };

  const { isConnected: isSocketConnected, lastMessage } = useWebSocket(handleAlert);
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
  const [activeTimeRange, setActiveTimeRange] = useState('24h');
  const [statsData, setStatsData] = useState({
    '24h': { mq2: null, mq7: null, mq135: null, loading: false },
    '7d': { mq2: null, mq7: null, mq135: null, loading: false },
    '30d': { mq2: null, mq7: null, mq135: null, loading: false },
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [fanRatios, setFanRatios] = useState({ fan1: null, fan2: null });

  // Fetch fan ratios from history data
  const fetchFanRatios = async (timeRange) => {
    if (!currentDeviceId) return;
    
    try {
      const response = await sensorDataService.getHistory({
        deviceId: currentDeviceId,
        timeRange,
        limit: 1000, // Lấy nhiều bản ghi để tính tỷ lệ chính xác
      });
      
      const data = response.data || [];
      if (data.length === 0) {
        setFanRatios({ fan1: null, fan2: null });
        return;
      }

      const fan1OnCount = data.filter(item => item.systemStatus?.fan1Status === true).length;
      const fan2OnCount = data.filter(item => item.systemStatus?.fan2Status === true).length;
      const totalCount = data.length;

      setFanRatios({
        fan1: totalCount > 0 ? (fan1OnCount / totalCount * 100) : null,
        fan2: totalCount > 0 ? (fan2OnCount / totalCount * 100) : null,
      });
    } catch (error) {
      console.error('Error fetching fan ratios:', error);
      setFanRatios({ fan1: null, fan2: null });
    }
  };

  // Fetch stats data
  const fetchStats = async (timeRange, sensorType) => {
    try {
      const response = await sensorDataService.getStats({
        timeRange,
        sensorType,
        deviceId: currentDeviceId,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for ${sensorType} (${timeRange}):`, error);
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
  };

  const loadStats = async (timeRange) => {
    setStatsData(prev => ({
      ...prev,
      [timeRange]: { ...prev[timeRange], loading: true },
    }));

    try {
      const [mq2Stats, mq7Stats, mq135Stats] = await Promise.all([
        fetchStats(timeRange, 'MQ2'),
        fetchStats(timeRange, 'MQ7'),
        fetchStats(timeRange, 'MQ135'),
      ]);

      setStatsData(prev => ({
        ...prev,
        [timeRange]: {
          mq2: mq2Stats,
          mq7: mq7Stats,
          mq135: mq135Stats,
          loading: false,
        },
      }));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsData(prev => ({
        ...prev,
        [timeRange]: { ...prev[timeRange], loading: false },
      }));
    }
  };

  // Load stats when timeRange changes or device changes
  useEffect(() => {
    if (currentDeviceId) {
      loadStats(activeTimeRange);
      fetchFanRatios(activeTimeRange);
    }
  }, [activeTimeRange, currentDeviceId]);

  // Load all time ranges on mount or device change
  useEffect(() => {
    if (currentDeviceId) {
      loadStats('24h');
      loadStats('7d');
      loadStats('30d');
    }
  }, [currentDeviceId]);

  const handleRefresh = () => {
    loadStats(activeTimeRange);
    fetchFanRatios(activeTimeRange);
  };

  // Render stats content for each time range
  const renderStatsContent = (timeRange) => {
    const stats = statsData[timeRange];
    
    if (!currentDeviceId) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Chưa có thiết bị được chọn
        </div>
      );
    }

    if (stats.loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!stats.mq2 || stats.mq2.count === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">MQ2 (LPG)</p>
            <p className="text-2xl font-bold">{stats.mq2.avg?.toFixed(2) || '0.00'} ppm</p>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {stats.mq2.min?.toFixed(2) || '0.00'} | Max: {stats.mq2.max?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Số bản ghi: {stats.mq2.count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">MQ7 (CO)</p>
            <p className="text-2xl font-bold">{stats.mq7.avg?.toFixed(2) || '0.00'} ppm</p>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {stats.mq7.min?.toFixed(2) || '0.00'} | Max: {stats.mq7.max?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Số bản ghi: {stats.mq7.count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">MQ135 (Air Quality)</p>
            <p className="text-2xl font-bold">{stats.mq135.avg?.toFixed(2) || '0.00'} ppm</p>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {stats.mq135.min?.toFixed(2) || '0.00'} | Max: {stats.mq135.max?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Số bản ghi: {stats.mq135.count || 0}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

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
          { label: "MQ2 - LPG/GAS", value: sensorData.mq2, unit: "PPM", max: 600, medium: 100, danger: 200 },
          { label: "MQ7 - CARBON MONOXIDE", value: sensorData.mq7, unit: "PPM", max: 400, medium: 25, danger: 100 },
          { label: "MQ135 - AIR QUALITY", value: sensorData.mq135, unit: "PPM", max: 4096, medium: 700, danger: 1000 }
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
                <ReferenceLine y={100} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={200} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
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
                <ReferenceLine y={25} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={100} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
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
                <ReferenceLine y={700} label="TB" stroke="orange" strokeDasharray="3 3" />
                <ReferenceLine y={1000} label="Nguy hiểm" stroke="red" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="mq135" stroke="var(--color-mq135)" fill="var(--color-mq135)" fillOpacity={0.4} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dữ liệu trung bình</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={statsData[activeTimeRange]?.loading || !currentDeviceId}
            >
              {statsData[activeTimeRange]?.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTimeRange === '24h' ? '24h' : activeTimeRange === '7d' ? '7days' : '30days'}
            onValueChange={(value) => {
              const timeRangeMap = { '24h': '24h', '7days': '7d', '30days': '30d' };
              setActiveTimeRange(timeRangeMap[value] || '24h');
            }}
            className="w-full"
          >
            <div className="flex justify-end mb-4">
              <TabsList>
                <TabsTrigger value="24h">24 Giờ</TabsTrigger>
                <TabsTrigger value="7days">7 Ngày</TabsTrigger>
                <TabsTrigger value="30days">30 Ngày</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="24h">
              {renderStatsContent('24h')}
            </TabsContent>
            <TabsContent value="7days">
              {renderStatsContent('7d')}
            </TabsContent>
            <TabsContent value="30days">
              {renderStatsContent('30d')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Trung bình MQ2</p>
            <p className="text-lg font-bold">
              {statsData[activeTimeRange]?.mq2?.avg !== null && statsData[activeTimeRange]?.mq2?.avg !== undefined
                ? `${statsData[activeTimeRange].mq2.avg.toFixed(2)} ppm`
                : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Trung bình MQ7</p>
            <p className="text-lg font-bold">
              {statsData[activeTimeRange]?.mq7?.avg !== null && statsData[activeTimeRange]?.mq7?.avg !== undefined
                ? `${statsData[activeTimeRange].mq7.avg.toFixed(2)} ppm`
                : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Trung bình MQ135</p>
            <p className="text-lg font-bold">
              {statsData[activeTimeRange]?.mq135?.avg !== null && statsData[activeTimeRange]?.mq135?.avg !== undefined
                ? `${statsData[activeTimeRange].mq135.avg.toFixed(2)} ppm`
                : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Tỷ lệ Quạt 1</p>
            <p className="text-lg font-bold">
              {fanRatios.fan1 !== null && fanRatios.fan1 !== undefined
                ? `${fanRatios.fan1.toFixed(1)}%`
                : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Tỷ lệ Quạt 2</p>
            <p className="text-lg font-bold">
              {fanRatios.fan2 !== null && fanRatios.fan2 !== undefined
                ? `${fanRatios.fan2.toFixed(1)}%`
                : '--'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-xs text-muted-foreground pb-4">
        Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')} {lastUpdate.toLocaleDateString('vi-VN')}
      </div>
    </div>
  );
};

export default AdminDashboard;
