import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { deviceService, thresholdService } from '../../services/deviceService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Wrench,
  Settings,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const Devices = () => {
  const { user, loading: authLoading } = useAuth();
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editingThreshold, setEditingThreshold] = useState(null);
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

  const queryClient = useQueryClient();

  // Fetch devices
  const { data, isLoading, error } = useQuery('devices', deviceService.getAll, {
    refetchInterval: 30000,
  });

  // Create mutation
  const createMutation = useMutation(deviceService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('devices');
      setIsDeviceDialogOpen(false);
      resetDeviceForm();
    },
  });

  // Update mutation
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

  // Delete mutation
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
    ({ deviceId, data }) => thresholdService.update(deviceId, data),
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
    setEditingThreshold(null);
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
          warning: device.threshold.mq2.warning,
          danger: device.threshold.mq2.danger,
        },
        mq7: {
          warning: device.threshold.mq7.warning,
          danger: device.threshold.mq7.danger,
        },
        mq135: {
          warning: device.threshold.mq135.warning,
          danger: device.threshold.mq135.danger,
        },
      });
    }
    setEditingThreshold(device);
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
    if (editingThreshold) {
      updateThresholdMutation.mutate({
        deviceId: editingThreshold._id,
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Đang hoạt động</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Bảo trì</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4" />;
      case 'offline':
        return <WifiOff className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSensorValueColor = (value, warning, danger) => {
    if (value >= danger) return 'text-destructive';
    if (value >= warning) return 'text-yellow-500';
    return 'text-foreground';
  };

  const getSafetyLevel = (sensors, threshold) => {
    if (!sensors || !threshold) return 1;
    
    let maxLevel = 1;
    sensors.forEach((sensor) => {
      if (sensor.latestValue !== null && sensor.latestValue !== undefined) {
        const sensorThreshold = threshold[sensor.type.toLowerCase()];
        if (sensorThreshold) {
          if (sensor.latestValue >= sensorThreshold.danger) {
            maxLevel = Math.max(maxLevel, 3);
          } else if (sensor.latestValue >= sensorThreshold.warning) {
            maxLevel = Math.max(maxLevel, 2);
          }
        }
      }
    });
    return maxLevel;
  };

  const devices = data?.data || [];

  // Kiểm tra quyền truy cập - chỉ admin mới được xem trang này
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Quản lý thiết bị</CardTitle>
              <CardDescription className="mt-1">
                Quản lý ESP32 và các cảm biến MQ (MQ2, MQ7, MQ135)
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDeviceDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm thiết bị
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Có lỗi xảy ra khi tải dữ liệu
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có thiết bị nào. Hãy thêm thiết bị đầu tiên.
            </div>
          ) : (
            <div className="grid gap-6">
              {devices.map((device) => {
                const safetyLevel = getSafetyLevel(device.sensors, device.threshold);
                return (
                  <Card key={device._id} className="border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{device.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(device.status)}
                              {getStatusBadge(device.status)}
                            </div>
                          </div>
                          <CardDescription>
                            MAC: {device.macAddress} {device.location && `• ${device.location}`}
                          </CardDescription>
                          {device.lastSeen && (
                            <p className="text-xs text-muted-foreground">
                              Lần cuối: {formatDate(device.lastSeen)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={device.status}
                            onValueChange={(value) =>
                              handleStatusChange(device._id, value)
                            }
                            disabled={updateStatusMutation.isLoading}
                          >
                            <SelectTrigger className="h-9 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">Đang hoạt động</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                              <SelectItem value="maintenance">Bảo trì</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenThresholdDialog(device)}
                            className="h-9 w-9"
                            title="Cấu hình ngưỡng"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDeviceDialog(device)}
                            className="h-9 w-9"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(device._id)}
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            disabled={deleteMutation.isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Safety Level Indicator */}
                      <div className="mb-6 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-5 w-5" />
                            <span className="font-medium">Mức an toàn:</span>
                          </div>
                          <Badge
                            variant={
                              safetyLevel === 3
                                ? 'destructive'
                                : safetyLevel === 2
                                ? 'warning'
                                : 'success'
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

                      {/* Sensors */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Cảm biến
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {device.sensors?.map((sensor) => {
                            const sensorThreshold =
                              device.threshold?.[sensor.type.toLowerCase()];
                            const value = sensor.latestValue;
                            const valueColor =
                              value !== null && value !== undefined && sensorThreshold
                                ? getSensorValueColor(
                                    value,
                                    sensorThreshold.warning,
                                    sensorThreshold.danger
                                  )
                                : 'text-muted-foreground';

                            return (
                              <Card
                                key={sensor._id}
                                className="border-border bg-card"
                              >
                                <CardContent className="pt-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">
                                        {sensor.type}
                                      </span>
                                      {sensor.isActive ? (
                                        <Badge variant="success" className="text-xs">
                                          Hoạt động
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          Tắt
                                        </Badge>
                                      )}
                                    </div>
                                    {sensor.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {sensor.description}
                                      </p>
                                    )}
                                    <div className="space-y-1">
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold" style={{ color: valueColor.includes('destructive') ? 'hsl(var(--destructive))' : valueColor.includes('yellow') ? '#eab308' : 'inherit' }}>
                                          {value !== null && value !== undefined
                                            ? value.toFixed(1)
                                            : '--'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {sensor.unit || 'ppm'}
                                        </span>
                                      </div>
                                      {sensorThreshold && (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            Cảnh báo: {sensorThreshold.warning}{' '}
                                            {sensor.unit || 'ppm'}
                                          </div>
                                          <div>
                                            Nguy hiểm: {sensorThreshold.danger}{' '}
                                            {sensor.unit || 'ppm'}
                                          </div>
                                        </div>
                                      )}
                                      {sensor.latestTimestamp && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {formatDate(sensor.latestTimestamp)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa thiết bị */}
      <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsDeviceDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? 'Sửa thiết bị' : 'Thêm thiết bị mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeviceSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên thiết bị *</Label>
                <Input
                  id="name"
                  value={deviceFormData.name}
                  onChange={(e) =>
                    setDeviceFormData({ ...deviceFormData, name: e.target.value })
                  }
                  placeholder="Ví dụ: ESP32 - Hầm B1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address *</Label>
                <Input
                  id="macAddress"
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
                <Label htmlFor="location">Vị trí</Label>
                <Input
                  id="location"
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
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={deviceFormData.status}
                  onValueChange={(value) =>
                    setDeviceFormData({
                      ...deviceFormData,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger id="status">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeviceDialogOpen(false)}
                disabled={
                  createMutation.isLoading || updateMutation.isLoading
                }
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isLoading || updateMutation.isLoading
                }
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

      {/* Dialog cấu hình ngưỡng */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => setIsThresholdDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Cấu hình ngưỡng cảm biến</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Thiết bị: {editingThreshold?.name}
            </p>
          </DialogHeader>
          <form onSubmit={handleThresholdSubmit}>
            <div className="space-y-6">
              {/* MQ2 */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ2</CardTitle>
                  <CardDescription className="text-xs">
                    LPG, Propane, Butane, Smoke
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

              {/* MQ7 */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ7</CardTitle>
                  <CardDescription className="text-xs">
                    Carbon Monoxide (CO)
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

              {/* MQ135 */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">MQ135</CardTitle>
                  <CardDescription className="text-xs">
                    NH3, NOx, Alcohol, Benzene, Smoke, CO2
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsThresholdDialogOpen(false)}
                disabled={updateThresholdMutation.isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateThresholdMutation.isLoading}>
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
