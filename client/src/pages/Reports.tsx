import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FileBarChart, 
  Download, 
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Activity,
  DollarSign,
  Users,
  Calendar,
  Filter
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface ReportData {
  inventoryOverview: {
    totalProducts: number;
    totalStockValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topProducts: Array<{
      name: string;
      currentStock: string;
      unit: string;
      value: number;
    }>;
  };
  stockMovement: {
    daily: Array<{
      date: string;
      stockIn: number;
      stockOut: number;
      net: number;
    }>;
    monthly: Array<{
      month: string;
      stockIn: number;
      stockOut: number;
      net: number;
    }>;
  };
  productAnalysis: Array<{
    category: string;
    count: number;
    totalStock: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    productName: string;
    quantity: string;
    user: string;
    date: string;
    soNumber?: string;
    poNumber?: string;
  }>;
  lowStockAlerts: Array<{
    id: number;
    name: string;
    currentStock: string;
    unit: string;
    status: 'critical' | 'low' | 'warning';
  }>;
  dashboardStats: {
    totalProducts: number;
    totalStock: number;
    todayStockIn: number;
    todayStockOut: number;
    activeProducts: number;
    lowStockProducts: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000'];

export default function Reports() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState("30days");



  // Check access permissions
  const hasAccess = (user as any)?.role === 'super_admin' || (user as any)?.role === 'master_inventory_handler';

  const { data: reportData, isLoading: reportLoading, error } = useQuery({
    queryKey: ["/api/reports/comprehensive", dateRange.from, dateRange.to],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: dateRange.from.toISOString(),
        toDate: dateRange.to.toISOString()
      });
      const response = await fetch(`/api/reports/comprehensive?${params}`, {
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to load reports: ${response.status}`);
      }
      
      const text = await response.text();
      try {
        return JSON.parse(text) as ReportData;
      } catch (parseError) {
        console.error("Failed to parse response:", text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
    },
    enabled: isAuthenticated && hasAccess,
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
    return null;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case "7days":
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case "30days":
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case "90days":
        setDateRange({ from: subDays(now, 90), to: now });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvData = [
      ['Report Type', 'Generated Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Period', `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`],
      [],
      ['Inventory Overview'],
      ['Total Products', reportData.inventoryOverview.totalProducts],
      ['Total Stock Value', reportData.inventoryOverview.totalStockValue],
      ['Low Stock Products', reportData.inventoryOverview.lowStockProducts],
      ['Out of Stock Products', reportData.inventoryOverview.outOfStockProducts],
      [],
      ['Recent Activity'],
      ['Date', 'Type', 'Product', 'Quantity', 'User', 'Order Number'],
      ...reportData.recentActivity.map(activity => [
        format(new Date(activity.date), 'yyyy-MM-dd HH:mm'),
        activity.type,
        activity.productName,
        activity.quantity,
        activity.user,
        activity.soNumber || activity.poNumber || 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Your report has been downloaded as CSV.",
    });
  };

  if (reportLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
            <p className="text-gray-600 text-sm">{error.message}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-600">No report data available for the selected period.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comprehensive Reports</h1>
          <p className="text-gray-600 mt-2">Complete inventory analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{reportData.inventoryOverview.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Value</p>
                <p className="text-2xl font-bold">{reportData.inventoryOverview.totalStockValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Stock In</p>
                <p className="text-2xl font-bold text-green-600">{reportData.dashboardStats.todayStockIn}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{reportData.dashboardStats.todayStockOut}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="movement">Stock Movement</TabsTrigger>
          <TabsTrigger value="analysis">Product Analysis</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.inventoryOverview.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.currentStock}</p>
                        <p className="text-sm text-gray-600">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Categories Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.productAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.productAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Stock Movement (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.stockMovement.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="stockIn" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Stock In" />
                    <Area type="monotone" dataKey="stockOut" stackId="2" stroke="#ffc658" fill="#ffc658" name="Stock Out" />
                    <Line type="monotone" dataKey="net" stroke="#ff7300" strokeWidth={2} name="Net Movement" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Stock Movement (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.stockMovement.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stockIn" fill="#82ca9d" name="Stock In" />
                    <Bar dataKey="stockOut" fill="#ffc658" name="Stock Out" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Analysis by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Product Count</th>
                      <th className="text-left p-4">Total Stock</th>
                      <th className="text-left p-4">Average Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.productAnalysis.map((category, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{category.category}</td>
                        <td className="p-4">{category.count}</td>
                        <td className="p-4">{category.totalStock.toFixed(2)}</td>
                        <td className="p-4">{(category.totalStock / category.count).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${activity.type === 'stock_in' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {activity.type === 'stock_in' ? (
                          <TrendingUp className={`h-4 w-4 ${activity.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <TrendingDown className={`h-4 w-4 ${activity.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{activity.productName}</p>
                        <p className="text-sm text-gray-600">
                          {activity.type === 'stock_in' ? 'Stock In' : 'Stock Out'} • {activity.quantity} units • by {activity.user}
                        </p>
                        {(activity.soNumber || activity.poNumber) && (
                          <p className="text-xs text-gray-500">
                            {activity.soNumber ? `SO: ${activity.soNumber}` : `PO: ${activity.poNumber}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{format(new Date(activity.date), 'MMM dd, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.lowStockAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.status === 'critical' ? 'text-red-500' : 
                        alert.status === 'low' ? 'text-yellow-500' : 'text-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.name}</p>
                        <p className="text-sm text-gray-600">{alert.currentStock} {alert.unit} remaining</p>
                      </div>
                    </div>
                    <Badge className={getBadgeColor(alert.status)}>
                      {alert.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
                {reportData.lowStockAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No low stock alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}