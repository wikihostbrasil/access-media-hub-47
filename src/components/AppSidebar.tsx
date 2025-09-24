import { useState } from "react";
import { Files, Users, FolderOpen, Settings, Download, BarChart3 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useApiAuth } from "@/hooks/useApiAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Profile {
  role: 'admin' | 'operator' | 'user';
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useApiAuth();

  // Use role from user object directly
  const userRole = user?.role || 'user';

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground";

  

  const menuItems = [
    { title: "Arquivos", url: "/files", icon: Files, roles: ['admin', 'operator', 'user'] },
    { title: "Usuários", url: "/users", icon: Users, roles: ['admin', 'operator'] },
    { title: "Grupos", url: "/groups", icon: FolderOpen, roles: ['admin', 'operator'] },
    { title: "Categorias", url: "/categories", icon: FolderOpen, roles: ['admin', 'operator'] },
    { title: "Downloads", url: "/downloads", icon: Download, roles: ['admin'] },
    { title: "Relatórios", url: "/reports", icon: BarChart3, roles: ['admin'] },
    { title: "Logs de Acesso", url: "/access-logs", icon: BarChart3, roles: ['admin'] },
    { title: "Configurações", url: "/settings", icon: Settings, roles: ['admin', 'operator'] },
    { title: "Meu Perfil", url: "/profile", icon: Users, roles: ['admin', 'operator', 'user'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={isCollapsed ? "w-18" : "w-60"}
      collapsible="icon"
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-sidebar-border flex justify-center items-center">
        {isCollapsed ? (
          <img 
            src="https://dummyimage.com/50x50/ddd/006DD9&text=L" 
            alt="Logo"
            className="w-4 h-4"
          />
        ) : (
          <img 
            src="https://dummyimage.com/200x50/ddd/006DD9&text=Logo" 
            alt="Logo"
            className="h-8 w-auto max-w-full"
          />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}