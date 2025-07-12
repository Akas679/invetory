import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  List,
  BarChart3,
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

export default function Home() {
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

  const isSuperAdmin = (user as any)?.role === "super_admin";
  const canViewDashboard = (user as any)?.role === "super_admin";

  // Redirect Master Inventory Handler to inventory page if they try to access dashboard
  if ((user as any)?.role === "master_inventory_handler") {
    window.location.href = "/inventory";
    return null;
  }

  // Redirect Master Inventory Handler users directly to inventory page
  if ((user as any)?.role === "master_inventory_handler") {
    window.location.href = "/inventory";
    return null;
  }

  // For other roles without dashboard access
  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to Sudhamrit Inventory
          </h1>
          <p className="text-gray-600">
            Use the navigation to manage your assigned tasks.
          </p>
        </div>
      </div>
    );
  }

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
                    {(stats as DashboardStats)?.totalProducts || 0}
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
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseFloat(
                      String((stats as DashboardStats)?.totalStock || 0),
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total units in stock
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Stock In
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {parseFloat(
                      String((stats as DashboardStats)?.todayStockIn || 0),
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Units added today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Stock Out
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {parseFloat(
                      String((stats as DashboardStats)?.todayStockOut || 0),
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Units removed today
                  </p>
                </CardContent>
              </Card>
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
            {/* <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sudhamrit Inventory Management
            </h1>
            <p className="text-xl text-gray-600">Super Admin Control Panel</p> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dashboard Button */}
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowDashboard(true)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  View stock statistics and system overview
                </p>
              </CardContent>
            </Card>

            {/* Master Inventory */}
            <Link href="/inventory">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Master Inventory</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Manage products and inventory items
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Stock Management */}
            <Link href="/stock-management">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Stock Management</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Handle stock in and stock out operations
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Transaction Log */}
            <Link href="/transactions">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <List className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">Transaction Log</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    View all stock transaction history
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* User Management */}
            <Link href="/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">User Management</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">Manage users and permissions</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
