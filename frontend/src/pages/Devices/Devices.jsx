import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../../components/ui/accordion';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertTriangle, Loader2, Fan, Activity, Zap, Clock, Settings, Gauge, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deviceService } from '../../services/deviceService';

const Devices = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeAccordion, setActiveAccordion] = useState("");
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceFormData, setDeviceFormData] = useState({
    name: '',
    macAddress: '',
    location: '',
    status: 'offline',
  });
  const [thresholdFormData, setThresholdFormData] = useState({
    mq2: { warning: 100, danger: 200 },
    mq7: { warning: 25, danger: 100 },
    mq135: { warning: 700, danger: 1000 },
  });
  const sensorRefs = useRef({});

  const queryClient = useQueryClient();

  // Fetch devices from API
  const { data, isLoading, error } = useQuery('devices', deviceService.getAll, {
    refetchInterval: 30000,
  });

  // Create device mutation
  const createMutation = useMutation(deviceService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('devices');
      setIsDeviceDialogOpen(false);
      resetDeviceForm();
    },
  });

  // Update device mutation
  const updateMutation = useMutation(
    ({ id, data }) => deviceService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('devices');
        setIsDeviceDialogOpen(false);
        resetDeviceForm();
      },
    }
  );

  // Delete device mutation
  const deleteMutation = useMutation(deviceService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('devices');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => deviceService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('devices');
      },
    }
  );

  // Update threshold mutation
  const updateThresholdMutation = useMutation(
    ({ deviceId, data }) => deviceService.update(deviceId, { threshold: data }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('devices');
        setIsThresholdDialogOpen(false);
        resetThresholdForm();
      },
    }
  );

  const resetDeviceForm = () => {
    setDeviceFormData({
      name: '',
      macAddress: '',
      location: '',
      status: 'offline',
    });
    setEditingDevice(null);
  };

  const resetThresholdForm = () => {
    setThresholdFormData({
      mq2: { warning: 100, danger: 200 },
      mq7: { warning: 25, danger: 100 },
      mq135: { warning: 700, danger: 1000 },
    });
    setEditingDevice(null);
  };

  const handleOpenDeviceDialog = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setDeviceFormData({
        name: device.name,
        macAddress: device.macAddress,
        location: device.location || '',
        status: device.status,
      });
    } else {
      resetDeviceForm();
    }
    setIsDeviceDialogOpen(true);
  };

  const handleOpenThresholdDialog = (device) => {
    if (device.threshold) {
      setThresholdFormData({
        mq2: {
          warning: device.threshold.mq2?.warning || 100,
          danger: device.threshold.mq2?.danger || 200,
        },
        mq7: {
          warning: device.threshold.mq7?.warning || 25,
          danger: device.threshold.mq7?.danger || 100,
        },
        mq135: {
          warning: device.threshold.mq135?.warning || 700,
          danger: device.threshold.mq135?.danger || 1000,
        },
      });
    }
    setEditingDevice(device);
    setIsThresholdDialogOpen(true);
  };

  const handleDeviceSubmit = (e) => {
    e.preventDefault();
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice._id, data: deviceFormData });
    } else {
      createMutation.mutate(deviceFormData);
    }
  };

  const handleThresholdSubmit = (e) => {
    e.preventDefault();
    if (editingDevice) {
      updateThresholdMutation.mutate({
        deviceId: editingDevice._id,
        data: thresholdFormData,
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleIllustrationClick = (sensorType) => {
    const ref = sensorRefs.current[sensorType];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Đang hoạt động</Badge>;
      case 'offline':
        return <Badge className="bg-red-600 hover:bg-red-700 text-white">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Bảo trì</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'online') return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    if (status === 'offline') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'maintenance') return <Settings className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const getSensorValueColor = (value, warning, danger) => {
    if (value >= danger) return 'text-red-600';
    if (value >= warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSafetyLevel = (sensors, threshold) => {
    if (!sensors || !threshold) return 1;
    
    let maxLevel = 1;
    sensors?.forEach((sensor) => {
      if (sensor.latestValue !== null && sensor.latestValue !== undefined) {
        const sensorThreshold = threshold[sensor.type.toLowerCase()];
        if (sensorThreshold) {
          if (sensor.latestValue >= sensorThreshold.danger) maxLevel = 3;
          else if (sensor.latestValue >= sensorThreshold.warning && maxLevel < 3) maxLevel = 2;
        }
      }
    });
    return maxLevel;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };


  // Check authorization
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
              <AlertTriangle className="h-16 w-16 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Không có quyền truy cập</h2>
                <p className="text-muted-foreground">
                  Bạn không có quyền truy cập trang này.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const devices = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Thiết bị</h1>
          <p className="text-muted-foreground">
            Cấu hình và giám sát các thiết bị ESP32 và cảm biến
          </p>
        </div>
        <Button onClick={() => handleOpenDeviceDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm thiết bị
        </Button>
      </div>

      {isLoading ? (
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mt-1">Không thể tải danh sách thiết bị. Vui lòng thử lại.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : devices.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            Chưa có thiết bị nào. Vui lòng thêm thiết bị từ backend.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible value={activeAccordion} onValueChange={setActiveAccordion} className="w-full space-y-4">
          {devices.map((device) => {
            const safetyLevel = getSafetyLevel(device.sensors, device.threshold);
            return (
              <AccordionItem key={device._id} value={device._id} className="border rounded-lg overflow-hidden bg-white">
                <AccordionTrigger className="px-6 hover:no-underline bg-slate-50 hover:bg-slate-100 py-4">
                  <div className="flex items-center justify-between w-full mr-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className="text-lg font-semibold">{device.name}</div>
                        <div className="text-xs text-muted-foreground">
                          MAC: {device.macAddress} {device.location && `• ${device.location}`}
                        </div>
                        {device.lastSeen && (
                          <div className="text-xs text-muted-foreground">
                            Lần cuối: {formatDate(device.lastSeen)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device.status)}
                      {getStatusBadge(device.status)}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pt-6 pb-6 bg-white space-y-6">
                  {/* Device Controls */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Trạng thái thiết bị:</span>
                      <Select
                        value={device.status}
                        onValueChange={(value) => handleStatusChange(device._id, value)}
                        disabled={updateStatusMutation.isLoading}
                      >
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Đang hoạt động</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="maintenance">Bảo trì</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenThresholdDialog(device)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Cấu hình ngưỡng
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeviceDialog(device)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(device._id)}
                        className="gap-2 text-red-600 hover:text-red-700"
                        disabled={deleteMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </div>

                  {/* Safety Level Indicator */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        <span className="font-medium">Mức an toàn:</span>
                      </div>
                      <Badge
                        className={
                          safetyLevel === 3
                            ? 'bg-red-600'
                            : safetyLevel === 2
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600'
                        }
                      >
                        {safetyLevel === 3
                          ? 'Nguy hiểm'
                          : safetyLevel === 2
                          ? 'Cảnh báo'
                          : 'An toàn'}
                      </Badge>
                    </div>
                  </div>

                  {/* Illustration Area - 2D Device Diagram */}
                  <div className="relative w-full h-[350px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden group">
                    <img 
                      src="/src/res/breadboard.webp" 
                      alt={`${device.name} Diagram`}
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded shadow-sm text-sm font-medium text-slate-600">
                      {device.name} - Chế độ xem 2D
                    </div>

                    {/* Sensor Hotspots */}
                    {device.sensors?.length > 0 && (
                      <>
                        {/* MQ2 Sensor */}
                        {device.sensors.some(s => s.type === 'MQ2') && (
                          <div 
                            className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleIllustrationClick('mq2')}
                          >
                            <div className="w-20 h-20 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                              MQ2
                            </div>
                            <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Cảm biến Gas
                            </div>
                          </div>
                        )}

                        {/* MQ7 Sensor */}
                        {device.sensors.some(s => s.type === 'MQ7') && (
                          <div 
                            className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleIllustrationClick('mq7')}
                          >
                            <div className="w-20 h-20 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                              MQ7
                            </div>
                            <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Cảm biến CO
                            </div>
                          </div>
                        )}

                        {/* MQ135 Sensor */}
                        {device.sensors.some(s => s.type === 'MQ135') && (
                          <div 
                            className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleIllustrationClick('mq135')}
                          >
                            <div className="w-20 h-20 rounded-full bg-gray-500 shadow-lg shadow-gray-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                              135
                            </div>
                            <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Chất lượng KK
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Sensors Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Cảm biến
                    </h3>
                    {device.sensors && device.sensors.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        {device.sensors.map((sensor) => {
                          const sensorThreshold = device.threshold?.[sensor.type.toLowerCase()];
                          const value = sensor.latestValue;
                          const valueColor = value !== null && value !== undefined && sensorThreshold
                            ? getSensorValueColor(value, sensorThreshold.warning, sensorThreshold.danger)
                            : 'text-muted-foreground';

                          return (
                            <Card 
                              key={sensor._id} 
                              className="bg-slate-50"
                              ref={(el) => {
                                if (el) sensorRefs.current[sensor.type.toLowerCase()] = el;
                              }}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-sm font-medium">{sensor.name || sensor.type}</CardTitle>
                                  <Badge 
                                    variant="outline" 
                                    className={`${getStatusColor(sensor.status)} text-white border-none`}
                                  >
                                    {sensor.status === 'normal' ? 'Bình thường' : sensor.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className={`text-2xl font-bold ${valueColor}`}>
                                  {value !== null && value !== undefined ? `${value.toFixed(2)}` : 'N/A'}
                                </div>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span>Cập nhật:</span>
                                    <span>{sensor.lastUpdated ? new Date(sensor.lastUpdated).toLocaleTimeString('vi-VN') : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>Ngưỡng:</span>
                                    {sensorThreshold ? (
                                      <span><span className="text-yellow-600">{sensorThreshold.warning}</span>/<span className="text-red-600">{sensorThreshold.danger}</span></span>
                                    ) : (
                                      <span>N/A</span>
                                    )}
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Loại cảm biến:</span>
                                    <span>{sensor.type}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Không có cảm biến được kết nối
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Dialog thêm/sửa thiết bị */}
      <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? 'Sửa thiết bị' : 'Thêm thiết bị mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeviceSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Tên thiết bị *</Label>
                <Input
                  id="device-name"
                  value={deviceFormData.name}
                  onChange={(e) =>
                    setDeviceFormData({ ...deviceFormData, name: e.target.value })
                  }
                  placeholder="Ví dụ: ESP32 - Phòng khách"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-mac">MAC Address *</Label>
                <Input
                  id="device-mac"
                  value={deviceFormData.macAddress}
                  onChange={(e) =>
                    setDeviceFormData({
                      ...deviceFormData,
                      macAddress: e.target.value,
                    })
                  }
                  placeholder="AA:BB:CC:DD:EE:FF"
                  required
                  disabled={!!editingDevice}
                />
                {editingDevice && (
                  <p className="text-xs text-muted-foreground">
                    MAC Address không thể thay đổi
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-location">Vị trí</Label>
                <Input
                  id="device-location"
                  value={deviceFormData.location}
                  onChange={(e) =>
                    setDeviceFormData({
                      ...deviceFormData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Mô tả vị trí lắp đặt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-status">Trạng thái</Label>
                <Select
                  value={deviceFormData.status}
                  onValueChange={(value) =>
                    setDeviceFormData({
                      ...deviceFormData,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger id="device-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Đang hoạt động</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeviceDialogOpen(false)}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {createMutation.isLoading || updateMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : editingDevice ? (
                  'Cập nhật'
                ) : (
                  'Thêm mới'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Threshold Configuration Dialog */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấu hình ngưỡng cảm biến</DialogTitle>
            {editingDevice && (
              <p className="text-sm text-muted-foreground mt-2">
                Thiết bị: <span className="font-semibold">{editingDevice.name}</span>
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleThresholdSubmit}>
            <div className="space-y-6">
              {/* MQ2 Configuration */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ2 - Cảm biến Khí Gas</CardTitle>
                  <CardDescription className="text-xs">
                    Phát hiện LPG, Propane, Butane, Khói
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mq2-warning">Ngưỡng cảnh báo (ppm)</Label>
                      <Input
                        id="mq2-warning"
                        type="number"
                        value={thresholdFormData.mq2.warning}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq2: {
                              ...thresholdFormData.mq2,
                              warning: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mq2-danger">Ngưỡng nguy hiểm (ppm)</Label>
                      <Input
                        id="mq2-danger"
                        type="number"
                        value={thresholdFormData.mq2.danger}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq2: {
                              ...thresholdFormData.mq2,
                              danger: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MQ7 Configuration */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ7 - Cảm biến Carbon Monoxide</CardTitle>
                  <CardDescription className="text-xs">
                    Phát hiện khí CO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mq7-warning">Ngưỡng cảnh báo (ppm)</Label>
                      <Input
                        id="mq7-warning"
                        type="number"
                        value={thresholdFormData.mq7.warning}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq7: {
                              ...thresholdFormData.mq7,
                              warning: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mq7-danger">Ngưỡng nguy hiểm (ppm)</Label>
                      <Input
                        id="mq7-danger"
                        type="number"
                        value={thresholdFormData.mq7.danger}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq7: {
                              ...thresholdFormData.mq7,
                              danger: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MQ135 Configuration */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ135 - Cảm biến Chất lượng Không khí</CardTitle>
                  <CardDescription className="text-xs">
                    Phát hiện NH3, NOx, Alcohol, Benzene, Khói, CO2
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mq135-warning">Ngưỡng cảnh báo (ppm)</Label>
                      <Input
                        id="mq135-warning"
                        type="number"
                        value={thresholdFormData.mq135.warning}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq135: {
                              ...thresholdFormData.mq135,
                              warning: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mq135-danger">Ngưỡng nguy hiểm (ppm)</Label>
                      <Input
                        id="mq135-danger"
                        type="number"
                        value={thresholdFormData.mq135.danger}
                        onChange={(e) =>
                          setThresholdFormData({
                            ...thresholdFormData,
                            mq135: {
                              ...thresholdFormData.mq135,
                              danger: Number(e.target.value),
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsThresholdDialogOpen(false)}
                disabled={updateThresholdMutation.isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateThresholdMutation.isLoading}
              >
                {updateThresholdMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu cấu hình'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devices;

