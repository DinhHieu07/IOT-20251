import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userService } from '../../services/userService';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  User,
  Shield,
  Eye,
  Key,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const Users = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'viewer',
    password: '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Fetch users
  const { data, isLoading, error } = useQuery('users', userService.getAllUsers, {
    refetchOnWindowFocus: false,
  });

  // Create user mutation
  const createMutation = useMutation(userService.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setIsUserDialogOpen(false);
      resetUserForm();
    },
  });

  // Update user mutation
  const updateMutation = useMutation(
    ({ id, data }) => userService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsUserDialogOpen(false);
        resetUserForm();
      },
    }
  );

  // Update password mutation
  const updatePasswordMutation = useMutation(
    ({ id, password }) => userService.updateUserPassword(id, password),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsPasswordDialogOpen(false);
        resetPasswordForm();
      },
    }
  );

  // Delete user mutation
  const deleteMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setDeletingUser(null);
    },
  });

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      email: '',
      fullName: '',
      role: 'viewer',
      password: '',
    });
    setEditingUser(null);
  };

  const resetPasswordForm = () => {
    setPasswordFormData({
      password: '',
      confirmPassword: '',
    });
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
        role: user.role,
        password: '',
      });
    } else {
      resetUserForm();
    }
    setIsUserDialogOpen(true);
  };

  const handleOpenPasswordDialog = (user) => {
    setEditingUser(user);
    resetPasswordForm();
    setIsPasswordDialogOpen(true);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    if (editingUser) {
      // Update user (không gửi password nếu không có)
      const updateData = {
        username: userFormData.username,
        email: userFormData.email,
        fullName: userFormData.fullName,
        role: userFormData.role,
      };
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      // Create user (cần password)
      if (!userFormData.password) {
        alert('Vui lòng nhập mật khẩu');
        return;
      }
      createMutation.mutate(userFormData);
    }
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();
    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordFormData.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    updatePasswordMutation.mutate({
      id: editingUser.id,
      password: passwordFormData.password,
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.username}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? (
      <Shield className="h-4 w-4" />
    ) : (
      <Eye className="h-4 w-4" />
    );
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? (
      <Badge variant="default" className="gap-1">
        <Shield className="h-3 w-3" />
        Quản trị viên
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Eye className="h-3 w-3" />
        Người xem
      </Badge>
    );
  };

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

  if (!currentUser || currentUser.role !== 'admin') {
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

  const users = data?.data || [];

  return (
    <div className="container mx-auto space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Quản lý tài khoản</CardTitle>
              <CardDescription className="mt-1">
                Quản lý tài khoản người dùng trong hệ thống
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenUserDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm tài khoản
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              Có lỗi xảy ra khi tải dữ liệu
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có tài khoản nào
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenUserDialog(user)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenPasswordDialog(user)}
                            title="Đổi mật khẩu"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteMutation.isLoading}
                            title="Xóa"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog tạo/sửa user */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </DialogTitle>
            <DialogClose onClose={() => {
              setIsUserDialogOpen(false);
              resetUserForm();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập *</Label>
                <Input
                  id="username"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, username: e.target.value })
                  }
                  required
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                  required
                  placeholder="Nhập email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ tên</Label>
                <Input
                  id="fullName"
                  value={userFormData.fullName}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, fullName: e.target.value })
                  }
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò *</Label>
                <Select
                  value={userFormData.role}
                  onValueChange={(value) =>
                    setUserFormData({ ...userFormData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>Người xem</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Quản trị viên</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, password: e.target.value })
                    }
                    required
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    minLength={6}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUserDialogOpen(false);
                  resetUserForm();
                }}
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
                ) : editingUser ? (
                  'Cập nhật'
                ) : (
                  'Thêm mới'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog đổi mật khẩu */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogClose onClose={() => {
              setIsPasswordDialogOpen(false);
              resetPasswordForm();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFormData.password}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      password: e.target.value,
                    })
                  }
                  required
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  placeholder="Nhập lại mật khẩu"
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPasswordForm();
                  setIsPasswordDialogOpen(false);
                }}
                disabled={updatePasswordMutation.isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updatePasswordMutation.isLoading}
              >
                {updatePasswordMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

