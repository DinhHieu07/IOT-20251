import { useState } from 'react';
import { useQuery } from 'react-query';
import { sensorDataService } from '../../services/sensorDataService';
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
import { Loader2, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SensorHistory = () => {
  const [filters, setFilters] = useState({
    deviceId: '',
    sensorType: '',
    timeRange: '24h',
    page: 1,
    limit: 50,
  });

  // Lấy danh sách devices
  const { data: devicesData } = useQuery('devices', deviceService.getAll, {
    select: (data) => data.data || [],
  });

  // Lấy lịch sử dữ liệu cảm biến
  const { data: historyData, isLoading, error } = useQuery(
    ['sensor-history', filters],
    () => sensorDataService.getHistory(filters),
    {
      keepPreviousData: true,
    }
  );

  // Lấy thống kê
  const { data: statsData } = useQuery(
    ['sensor-stats', filters],
    () => sensorDataService.getStats(filters),
    {
      enabled: !!filters.deviceId || !!filters.sensorType,
    }
  );

  const handleFilterChange = (key, value) => {
    // Nếu value là "all" thì set thành empty string để không filter
    const filterValue = value === 'all' ? '' : value;
    setFilters((prev) => ({
      ...prev,
      [key]: filterValue,
      page: 1, // Reset về trang 1 khi filter thay đổi
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const getSafetyLevelBadge = (level) => {
    const variants = {
      1: { variant: 'success', label: 'An toàn' },
      2: { variant: 'warning', label: 'Cảnh báo' },
      3: { variant: 'danger', label: 'Nguy hiểm' },
    };
    const config = variants[level] || variants[1];
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lịch sử dữ liệu cảm biến</h1>
          <p className="text-muted-foreground mt-2">
            Xem và phân tích dữ liệu cảm biến theo thời gian
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
            <CardDescription>Lọc dữ liệu theo thiết bị, loại cảm biến và thời gian</CardDescription>
          </CardHeader>
          <CardContent className="relative z-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative z-10">
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

              <div className="relative z-10">
                <label className="text-sm font-medium mb-2 block">Loại cảm biến</label>
                <Select
                  value={filters.sensorType || 'all'}
                  onValueChange={(value) => handleFilterChange('sensorType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả loại" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="MQ2">MQ2</SelectItem>
                    <SelectItem value="MQ7">MQ7</SelectItem>
                    <SelectItem value="MQ135">MQ135</SelectItem>
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
        {statsData?.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.data.avg?.toFixed(2) || '0.00'} ppm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tối thiểu</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.data.min?.toFixed(2) || '0.00'} ppm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tối đa</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.data.max?.toFixed(2) || '0.00'} ppm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số bản ghi</CardTitle>
                <Minus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.data.count || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu cảm biến</CardTitle>
            <CardDescription>
              {pagination.total ? `Tổng cộng: ${pagination.total} bản ghi` : 'Đang tải...'}
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
                Không có dữ liệu
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Thiết bị</TableHead>
                        <TableHead>Loại cảm biến</TableHead>
                        <TableHead>Giá trị (ppm)</TableHead>
                        <TableHead>Mức độ an toàn</TableHead>
                        <TableHead>Trạng thái quạt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{formatDate(item.timestamp)}</TableCell>
                          <TableCell>
                            {item.sensorId?.deviceId?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getSensorTypeBadge(item.sensorId?.type || 'N/A')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.value?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            {getSafetyLevelBadge(item.systemStatus?.safetyLevel)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge
                                variant={item.systemStatus?.fan1Status ? 'success' : 'outline'}
                              >
                                Q1: {item.systemStatus?.fan1Status ? 'Bật' : 'Tắt'}
                              </Badge>
                              <Badge
                                variant={item.systemStatus?.fan2Status ? 'success' : 'outline'}
                              >
                                Q2: {item.systemStatus?.fan2Status ? 'Bật' : 'Tắt'}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
  );
};

export default SensorHistory;

