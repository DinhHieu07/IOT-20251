import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { alertService } from '../../services/alertService';
import { deviceService } from '../../services/deviceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { formatDate } from '../../utils/helpers';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Bell } from 'lucide-react';

const AlertHistory = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    deviceId: '',
    type: '',
    isResolved: '',
    timeRange: '24h',
    page: 1,
    limit: 50,
  });

  // Lấy danh sách devices
  const { data: devicesData } = useQuery('devices', deviceService.getAll, {
    select: (data) => data.data || [],
  });

  // Lấy lịch sử cảnh báo
  const { data: historyData, isLoading, error } = useQuery(
    ['alert-history', filters],
    () => alertService.getHistory(filters),
    {
      keepPreviousData: true,
    }
  );

  // Lấy thống kê
  const { data: statsData } = useQuery(
    ['alert-stats', filters],
    () => alertService.getStats(filters)
  );

  // Mutation để cập nhật trạng thái
  const updateStatusMutation = useMutation(
    ({ alertId, isResolved }) => alertService.updateStatus(alertId, isResolved),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['alert-history', filters]);
        queryClient.invalidateQueries(['alert-stats', filters]);
      },
    }
  );

  const handleFilterChange = (key, value) => {
    // Nếu value là "all" thì set thành empty string để không filter
    const filterValue = value === 'all' ? '' : value;
    setFilters((prev) => ({
      ...prev,
      [key]: filterValue,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResolveToggle = (alertId, currentStatus) => {
    updateStatusMutation.mutate({
      alertId,
      isResolved: !currentStatus,
    });
  };

  const getAlertTypeBadge = (type) => {
    const variants = {
      WARNING: { variant: 'warning', label: 'Cảnh báo', icon: AlertTriangle },
      DANGER: { variant: 'danger', label: 'Nguy hiểm', icon: XCircle },
      ERROR: { variant: 'danger', label: 'Lỗi', icon: XCircle },
    };
    const config = variants[type] || variants.WARNING;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSensorTypeBadge = (type) => {
    const colors = {
      MQ2: 'bg-blue-500',
      MQ7: 'bg-purple-500',
      MQ135: 'bg-orange-500',
    };
    return (
      <Badge className={`${colors[type] || 'bg-gray-500'} text-white`}>
        {type}
      </Badge>
    );
  };

  const history = historyData?.data || [];
  const pagination = historyData?.pagination || {};
  const stats = statsData?.data || {};

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto ">
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lịch sử cảnh báo</h1>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý các cảnh báo từ hệ thống
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
            <CardDescription>Lọc cảnh báo theo thiết bị, mức độ và thời gian</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Thiết bị</label>
                <Select
                  value={filters.deviceId || 'all'}
                  onValueChange={(value) => handleFilterChange('deviceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả thiết bị" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="all">Tất cả thiết bị</SelectItem>
                    {devicesData?.map((device) => (
                      <SelectItem key={device._id} value={device._id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mức độ</label>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả mức độ" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="all">Tất cả mức độ</SelectItem>
                    <SelectItem value="WARNING">Cảnh báo</SelectItem>
                    <SelectItem value="DANGER">Nguy hiểm</SelectItem>
                    <SelectItem value="ERROR">Lỗi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                <Select
                  value={filters.isResolved || 'all'}
                  onValueChange={(value) => handleFilterChange('isResolved', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="false">Chưa xử lý</SelectItem>
                    <SelectItem value="true">Đã xử lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Khoảng thời gian</label>
                <Select
                  value={filters.timeRange}
                  onValueChange={(value) => handleFilterChange('timeRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 giờ qua</SelectItem>
                    <SelectItem value="7d">7 ngày qua</SelectItem>
                    <SelectItem value="30d">30 ngày qua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Số lượng/trang</label>
                <Select
                  value={filters.limit.toString()}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats.total !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng cảnh báo</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chưa xử lý</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.unresolved || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.resolved || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nguy hiểm</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="text-lg px-3 py-1">
                    {stats.byType?.find((s) => s._id === 'DANGER')?.count || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cảnh báo</CardTitle>
            <CardDescription>
              {pagination.total ? `Tổng cộng: ${pagination.total} cảnh báo` : 'Đang tải...'}
            </CardDescription>
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
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không có cảnh báo nào
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="rounded-md border overflow-hidden">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[110px]">Thời gian</TableHead>
                            <TableHead className="w-[140px]">Thiết bị</TableHead>
                            <TableHead className="w-[90px]">Cảm biến</TableHead>
                            <TableHead className="w-[110px]">Mức độ</TableHead>
                            <TableHead className="w-[180px] min-w-[180px]">Thông báo</TableHead>
                            <TableHead className="w-[90px]">Giá trị</TableHead>
                            <TableHead className="w-[90px]">Ngưỡng</TableHead>
                            <TableHead className="w-[110px]">Trạng thái</TableHead>
                            <TableHead className="w-[140px]">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((alert) => (
                            <TableRow key={alert._id}>
                              <TableCell className="whitespace-nowrap text-xs">{formatDate(alert.timestamp)}</TableCell>
                              <TableCell>
                                <div className="truncate max-w-[140px]" title={alert.sensorId?.deviceId?.name || 'N/A'}>
                                  {alert.sensorId?.deviceId?.name || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getSensorTypeBadge(alert.sensorId?.type || 'N/A')}
                              </TableCell>
                              <TableCell>{getAlertTypeBadge(alert.type)}</TableCell>
                              <TableCell className="max-w-[180px]">
                                <p className="truncate text-xs" title={alert.message || 'N/A'}>
                                  {alert.message || 'N/A'}
                                </p>
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap text-xs">
                                {alert.sensorValue?.toFixed(2) || '0.00'} ppm
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                                {alert.thresholdValue?.toFixed(2) || '0.00'} ppm
                              </TableCell>
                              <TableCell>
                                {alert.isResolved ? (
                                  <Badge variant="success" className="flex items-center gap-1 w-fit text-xs">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Đã xử lý
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="flex items-center gap-1 w-fit text-xs">
                                    <AlertTriangle className="h-3 w-3" />
                                    Chưa xử lý
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant={alert.isResolved ? 'outline' : 'default'}
                                  size="sm"
                                  onClick={() => handleResolveToggle(alert._id, alert.isResolved)}
                                  disabled={updateStatusMutation.isLoading}
                                  className="whitespace-nowrap text-xs"
                                >
                                  {alert.isResolved ? 'Chưa xử lý' : 'Đã xử lý'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Trang {pagination.page} / {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default AlertHistory;

