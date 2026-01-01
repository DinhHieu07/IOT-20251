import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Bell, Check, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      // Update local state to reflect change immediately
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'danger': return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử thông báo</h1>
          <p className="text-muted-foreground">
            Xem lại các sự kiện và cảnh báo của hệ thống
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead}>
          <Check className="mr-2 h-4 w-4" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Không có thông báo nào</h3>
            <p className="text-muted-foreground">Hệ thống chưa ghi nhận sự kiện nào.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={`transition-colors ${!notification.isRead ? 'bg-muted/30 border-l-4 border-l-primary' : ''}`}
              onClick={() => !notification.isRead && handleMarkRead(notification._id)}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {format(new Date(notification.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0 self-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
