import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogOut, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-semibold">Hệ thống Quạt Thông gió Hầm Gửi xe</h1>
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  location.pathname === '/'
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Trang chủ
              </Link>
              {isAuthenticated && (
                <>
                  {user && (user.role === 'admin' && (
                    <Link
                      to="/dashboard"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-foreground/80",
                        location.pathname === '/dashboard'
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      Dashboard
                    </Link>
                  ))}
                  {user && user.role === 'admin' && (
                    <Link
                      to="/devices"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-foreground/80",
                        location.pathname === '/devices'
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      Thiết bị
                    </Link>
                  )}
                  {user && user.role === 'admin' && (
                    <Link
                      to="/users"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-foreground/80",
                        location.pathname === '/users'
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      Tài khoản
                    </Link>
                  )}
                  {user && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{user.username}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    location.pathname === '/login'
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Đăng nhập
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2024 Hệ thống Quạt Thông gió Hầm Gửi xe. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
