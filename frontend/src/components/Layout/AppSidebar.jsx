import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "../../contexts/AuthContext"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Server, Users, Settings, LogOut, User, Bell } from "lucide-react"
import { Button } from "../ui/button"

export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const adminItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Thiết bị",
      url: "/devices",
      icon: Server,
    },
    {
      title: "Lịch sử thông báo",
      url: "/notifications",
      icon: Bell,
    },
    // Add more admin items if needed
  ]

  const viewerItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Lịch sử thông báo",
      url: "/notifications",
      icon: Bell,
    },
  ]

  const items = user?.role === 'admin' ? adminItems : viewerItems

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                </div>
            </div>
            <Button variant="outline" className="w-full justify-start" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
