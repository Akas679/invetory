import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AlertDashboard from "@/components/AlertDashboard";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  List,
  BarChart3,
  Plus,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  todayStockIn: number;
  todayStockOut: number;
  activeProducts: number;
  lowStockProducts: number;
}

export default function HomeNew() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled:
      isAuthenticated && showDashboard && (user as any)?.role === "super_admin",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to Sudhamrit Inventory Management
          </h1>
          <p className="text-gray-600">Please log in to access the system.</p>
        </div>
      </div>
    );
  }

  const userRole = (user as any)?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAttendanceManager = userRole === "attendance_manager";
  const isMasterInventoryHandler = userRole === "master_inventory_handler";
  const isStockInManager = userRole === "stock_in_manager";
  const isStockOutManager = userRole === "stock_out_manager";

  // Super Admin main page with button navigation
  if (isSuperAdmin) {
    // Show dashboard stats if user clicked Dashboard button
    if (showDashboard) {
      if (statsLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Overview of your inventory system
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDashboard(false)}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                Back to Menu
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalProducts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active inventory items
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Stock
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalStock || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total units in stock
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today Stock In
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.todayStockIn || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Units added today
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today Stock Out
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.todayStockOut || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Units removed today
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts Section */}
            <div className="mt-8">
              <AlertDashboard />
            </div>
          </div>
        </div>
      );
    }

    // Super Admin main menu with buttons
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Super Admin Control Panel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dashboard Button */}
            <div
              className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer"
              onClick={() => setShowDashboard(true)}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium">Dashboard</h3>
                <p className="text-gray-600 text-sm mt-2">
                  View stock statistics and system overview
                </p>
              </div>
            </div>

            {/* Master Inventory */}
            <Link href="/master-inventory">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium">Master Inventory</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Manage products and inventory planning
                  </p>
                </div>
              </div>
            </Link>

            {/* Stock Management */}
            <Link href="/stock-management">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">Stock Management</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Handle stock in and stock out operations
                  </p>
                </div>
              </div>
            </Link>

            {/* Transaction Log */}
            <Link href="/transactions">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                    <List className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium">Transaction Log</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    View all stock movement history
                  </p>
                </div>
              </div>
            </Link>

            {/* User Management */}
            <Link href="/users">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium">User Management</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Manage system users and permissions
                  </p>
                </div>
              </div>
            </Link>

            {/* Attendance Button - only for attendance_manager or super_admin */}
            {["attendance_manager", "super_admin"].includes(userRole) && (
              <a
                href="https://attandace.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">Attendance</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Track employee attendance and manage schedules
                    </p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Master Inventory Handler Dashboard
  if (isMasterInventoryHandler) {
    // Debug logging
    console.log("Home-new: Master Inventory Handler dashboard rendering");
    console.log("User role:", userRole);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Master Inventory Handler</p>
            <p className="text-sm text-blue-600 mt-2">✓ Dashboard page loaded correctly</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Master Inventory Button */}
            <Link href="/master-inventory">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium">Master Inventory</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Access product management and weekly stock planning
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Stock In Manager Dashboard
  if (isStockInManager) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Stock In Manager</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Stock In Button */}
            <Link href="/stock-management">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <ArrowUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">Stock In</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Add stock quantities to inventory
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Stock Out Manager Dashboard
  if (isStockOutManager) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Stock Out Manager</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Stock Out Button */}
            <Link href="/stock-management">
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <ArrowDown className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium">Stock Out</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Remove stock quantities from inventory
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Attendance Manager Dashboard
  if (isAttendanceManager) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Attendance Manager</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Attendance Button styled like Stock Out */}
            <a
              href="https://attandace.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-6 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium">Attendance</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Track employee attendance and manage schedules
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // For any other roles or unrecognized users, show simple welcome message
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Welcome to Sudhamrit Inventory
        </h1>
        <p className="text-gray-600">
          Access your assigned functionality through the system.
        </p>
      </div>
    </div>
  );
}
