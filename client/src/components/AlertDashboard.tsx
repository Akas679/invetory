import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, CheckCircle, RefreshCw, Package, Calendar } from "lucide-react";
import type { LowStockAlertWithDetails } from "@shared/schema";

interface AlertDashboardProps {
  className?: string;
}

export default function AlertDashboard({ className }: AlertDashboardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unresolved alerts
  const { data: alerts = [], isLoading } = useQuery<LowStockAlertWithDetails[]>({
    queryKey: ["/api/alerts/low-stock"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual low stock checking mutation
  const checkLowStockMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/alerts/check-low-stock", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/low-stock"] });
      toast({
        title: "Low Stock Check Complete",
        description: `${data.newAlerts || 0} new alerts created`,
      });
      setIsChecking(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check low stock",
        variant: "destructive",
      });
      setIsChecking(false);
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/alerts/low-stock/${alertId}/resolve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/low-stock"] });
      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const handleCheckLowStock = () => {
    setIsChecking(true);
    checkLowStockMutation.mutate();
  };

  const handleResolveAlert = (alertId: number) => {
    if (confirm("Mark this alert as resolved?")) {
      resolveAlertMutation.mutate(alertId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case "low":
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">{level}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Low Stock Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckLowStock}
            disabled={isChecking || checkLowStockMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? "Checking..." : "Check Now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Alerts
            </h3>
            <p className="text-gray-600">
              All products meet their planned stock requirements for this week.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: LowStockAlertWithDetails) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-orange-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {alert.product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Product ID: {alert.productId}
                      </p>
                    </div>
                  </div>
                  {getAlertLevelBadge(alert.alertLevel)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-lg font-semibold text-red-600">
                      {parseFloat(alert.currentStock).toFixed(3).replace(/\.?0+$/, '')}
                    </p>
                    <p className="text-xs text-gray-500">{alert.product.unit}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Planned Quantity</p>
                    <p className="text-lg font-semibold text-green-600">
                      {parseFloat(alert.plannedQuantity).toFixed(3).replace(/\.?0+$/, '')}
                    </p>
                    <p className="text-xs text-gray-500">{alert.weeklyPlan.unit}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Shortage</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {(parseFloat(alert.plannedQuantity) - parseFloat(alert.currentStock)).toFixed(3).replace(/\.?0+$/, '')}
                    </p>
                    <p className="text-xs text-gray-500">{alert.weeklyPlan.unit}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Week: {new Date(alert.weeklyPlan.weekStartDate).toLocaleDateString()} - 
                      {" "}{new Date(alert.weeklyPlan.weekEndDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      Alert created: {formatDate(alert.alertDate)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}