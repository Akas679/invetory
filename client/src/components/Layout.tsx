import { ReactNode } from "react";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, TrendingDown, List, Users, Home, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = "/";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'master_inventory_handler':
        return 'bg-blue-100 text-blue-800';
      case 'stock_in_manager':
        return 'bg-green-100 text-green-800';
      case 'stock_out_manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'attendance_manager':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '👑 Super Admin';
      case 'master_inventory_handler':
        return '🧑‍🔧 Master Inventory Handler';
      case 'stock_in_manager':
        return '📥 Stock In Manager';
      case 'stock_out_manager':
        return '📤 Stock Out Manager';
      case 'attendance_manager':
        return '🗓️ Attendance Manager';
      default:
        return role;
    }
  };

  const getNavigationItems = () => {
    const items = [
      { label: 'Dashboard', icon: Home, href: '/', roles: ['super_admin'] },
    ];

    // Role-specific navigation
    switch ((user as User)?.role) {
      case 'super_admin':
        items.push(
          { label: 'Master Inventory', icon: Package, href: '/inventory', roles: ['super_admin'] },
          { label: 'Stock Management', icon: TrendingUp, href: '/stock-management', roles: ['super_admin'] },
          { label: 'Transaction Log', icon: List, href: '/transactions', roles: ['super_admin'] },
          { label: 'User Management', icon: Users, href: '/users', roles: ['super_admin'] }
        );
        break;
      case 'master_inventory_handler':
        items.push(
          { label: 'Master Inventory', icon: Package, href: '/inventory', roles: ['master_inventory_handler'] }
        );
        break;
      case 'stock_in_manager':
        items.push(
          { label: 'Stock Management', icon: TrendingUp, href: '/stock-management', roles: ['stock_in_manager'] }
        );
        break;
      case 'stock_out_manager':
        items.push(
          { label: 'Stock Management', icon: TrendingDown, href: '/stock-management', roles: ['stock_out_manager'] }
        );
        break;
      case 'attendance_manager':
        items.push(
          { label: 'Attendance', icon: List, href: 'https://attandace.netlify.app/', roles: ['attendance_manager'] }
        );
        break;
    }

    return items.filter(item => item.roles.includes((user as User)?.role || ''));
  };

  const navigationItems = getNavigationItems();
  
  // Check if user should not show sidebar (stock managers, attendance manager, and super admin)
  const hideSidebar = (user as User)?.role === 'stock_in_manager' ||
                      (user as User)?.role === 'stock_out_manager' ||
                      (user as User)?.role === 'master_inventory_handler' ||
                      (user as User)?.role === 'super_admin' ||
                      (user as User)?.role === 'attendance_manager';

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F5F0F6'}}>
      {/* Navigation Bar */}
      <nav className="text-purple-900 shadow-lg" style={{backgroundColor: '#F5F0F6', borderBottom: '1px solid #E2D5F3'}}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer rounded-lg p-2" style={{backgroundColor: '#F5F0F6'}}>
                <img 
                  src="/assets/111_1750417572953.png" 
                  alt="Sudhamrit Logo" 
                  className="h-8 w-auto"
                />
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <Badge className={`${getRoleBadgeColor((user as User)?.role || '')} border-0`}>
                    {getRoleDisplayName((user as User)?.role || '')}
                  </Badge>
                  <span className="text-sm">
                    {(user as User)?.firstName || (user as User)?.username || (user as User)?.email || 'User'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-purple-700 border-purple-300 hover:bg-purple-100 hover:text-purple-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Hidden for stock managers and super admin */}
        {!hideSidebar && (
          <div className="w-64 shadow-md min-h-screen border-r border-purple-200" style={{backgroundColor: '#F5F0F6'}}>
            <div className="p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start btn-large ${
                          isActive ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content - Full width for stock managers and super admin */}
        <div className={`${hideSidebar ? 'flex-1' : 'flex-1'} p-6`}>
          {children}
        </div>
      </div>
    </div>
  );
}
