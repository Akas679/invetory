import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Search, RotateCcw, Filter, ArrowLeft } from "lucide-react";
import type { StockTransactionWithDetails } from "@shared/schema";
import { Link } from "wouter";

// Utility function to format quantity display with proper decimals
const formatQuantityDisplay = (transaction: StockTransactionWithDetails) => {
  // Always show original quantity if available
  if ((transaction as any).originalQuantity) {
    const originalQty = parseFloat((transaction as any).originalQuantity);
    // Remove unnecessary decimal zeros and limit to 3 decimal places
    return originalQty % 1 === 0
      ? originalQty.toString()
      : originalQty.toFixed(3).replace(/\.?0+$/, "");
  }

  // Otherwise show standard quantity with proper formatting
  const qty = parseFloat(transaction.quantity);
  return qty % 1 === 0 ? qty.toString() : qty.toFixed(3).replace(/\.?0+$/, "");
};

// Utility function to format unit display
const formatUnitDisplay = (transaction: StockTransactionWithDetails) => {
  // Always show original unit if available
  if ((transaction as any).originalUnit) {
    return (transaction as any).originalUnit;
  }

  // Otherwise show product unit
  return transaction.product.unit;
};

export default function TransactionLog() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showDashboard, setShowDashboard] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Only Super Admin can access transaction log
  const canViewTransactions = (user as any)?.role === "super_admin";

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canViewTransactions) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view transaction logs.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, canViewTransactions, toast]);

  const endpoint = "/api/transactions";

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== "all")
      params.append("type", filters.type);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    return params.toString();
  };

  const {
    data: transactions,
    isLoading: transactionsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [endpoint, filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isAuthenticated,
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      type: "all",
      fromDate: "",
      toDate: "",
    });
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "master_inventory_handler":
        return "Master Inventory Handler";
      case "stock_in_manager":
        return "Stock In Manager";
      case "stock_out_manager":
        return "Stock Out Manager";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard with button first
  if (showDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 relative">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back to Home Button */}
          <div className="absolute top-4 left-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12 pt-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Transaction Log Dashboard
            </h1>
            <p className="text-xl text-gray-600">Super Admin</p>
            <p className="text-gray-500 mt-2">
              Click the button below to view transaction history
            </p>
          </div>



          <div className="grid grid-cols-1 gap-8">
            <Card
              className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer p-6 border-2 border-yellow-200"
              onClick={() => setShowDashboard(false)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <List className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl text-yellow-800">
                  Transaction Log
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-lg mb-3">
                  View all stock movement history and transaction details
                </p>
                <p className="text-sm text-yellow-600 font-medium">
                  Click to open transaction log
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          className="flex items-center space-x-2"
          onClick={() => setShowDashboard(true)}
        >
          <span>← Back to Home</span>
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <List className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Transaction Log</h1>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Transaction Type
              </label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="stock_in">Stock In</SelectItem>
                  <SelectItem value="stock_out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Apply
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-0">
          {transactionsLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">Date & Time</th>
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Quantity</th>
                    <th className="text-left p-4 font-semibold">Unit</th>
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">
                      SO/PO Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.map(
                    (transaction: StockTransactionWithDetails) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          {formatDate(
                            transaction.transactionDate?.toString() || "",
                          )}
                        </td>
                        <td className="p-4">{transaction.product?.name}</td>
                        <td className="p-4">
                          <Badge
                            variant={
                              transaction.type === "stock_in"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              transaction.type === "stock_in"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {transaction.type === "stock_in"
                              ? "Stock In"
                              : "Stock Out"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {formatQuantityDisplay(transaction)}
                        </td>
                        <td className="p-4">
                          {formatUnitDisplay(transaction)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {transaction.user?.username || "N/A"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {getRoleDisplayName(transaction.user?.role || "")}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {(transaction as any).poNumber && (
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                PO: {(transaction as any).poNumber}
                              </span>
                            )}
                            {(transaction as any).soNumber && (
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                SO: {(transaction as any).soNumber}
                              </span>
                            )}
                            {(transaction as any).orderNumber && (
                              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Order: {(transaction as any).orderNumber}
                              </span>
                            )}
                            {!(transaction as any).poNumber &&
                              !(transaction as any).soNumber &&
                              !(transaction as any).orderNumber && (
                                <span className="text-gray-400 italic">-</span>
                              )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
              {transactions?.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No transactions found</p>
                  <p className="text-sm">
                    Transactions will appear here once you start recording stock
                    movements.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
