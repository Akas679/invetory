import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Package, Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import ProductSearch from "@/components/ProductSearch";
import type { Product, WeeklyStockPlanWithDetails } from "@shared/schema";
import { Link } from "wouter";

// Form validation schema
const weeklyPlanSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  plannedQuantity: z.string()
    .min(1, "Planned quantity is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Planned quantity must be a valid positive number"
    }),
  unit: z.string().min(1, "Unit is required"),
  weekStartDate: z.string().min(1, "Week start date is required"),
  weekEndDate: z.string().min(1, "Week end date is required"),
  notes: z.string().optional(),
});

type WeeklyPlanFormData = z.infer<typeof weeklyPlanSchema>;

// Available units
const units = ["KG", "Grams", "Litre", "Millilitre", "Pieces"];

export default function WeeklyStockPlanning() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyStockPlanWithDetails | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current date for default week range
  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Sunday
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  };

  const form = useForm<WeeklyPlanFormData>({
    resolver: zodResolver(weeklyPlanSchema),
    defaultValues: {
      productId: 0,
      plannedQuantity: "",
      unit: "",
      weekStartDate: getCurrentWeekRange().start,
      weekEndDate: getCurrentWeekRange().end,
      notes: "",
    },
  });

  // Fetch weekly stock plans
  const { data: weeklyPlans = [], isLoading } = useQuery<WeeklyStockPlanWithDetails[]>({
    queryKey: ["/api/weekly-stock-plans"],
  });

  // Create weekly stock plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: WeeklyPlanFormData) => {
      const response = await fetch("/api/weekly-stock-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-stock-plans"] });
      setIsDialogOpen(false);
      setSelectedProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Weekly stock plan created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Weekly stock plan creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create weekly stock plan",
        variant: "destructive",
      });
    },
  });

  // Update weekly stock plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: WeeklyPlanFormData }) => {
      const response = await fetch(`/api/weekly-stock-plans/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-stock-plans"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      setSelectedProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Weekly stock plan updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update weekly stock plan",
        variant: "destructive",
      });
    },
  });

  // Delete weekly stock plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/weekly-stock-plans/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-stock-plans"] });
      toast({
        title: "Success",
        description: "Weekly stock plan deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete weekly stock plan",
        variant: "destructive",
      });
    },
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    form.setValue("productId", product.id);
    form.setValue("unit", product.unit);
  };

  const handleSubmit = (data: WeeklyPlanFormData) => {
    console.log("Form submission data:", data);
    console.log("Form validation errors:", form.formState.errors);
    
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEdit = (plan: WeeklyStockPlanWithDetails) => {
    setEditingPlan(plan);
    setSelectedProduct(plan.product);
    form.reset({
      productId: plan.productId,
      plannedQuantity: plan.plannedQuantity,
      unit: plan.unit,
      weekStartDate: plan.weekStartDate,
      weekEndDate: plan.weekEndDate,
      notes: plan.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this weekly stock plan?")) {
      deletePlanMutation.mutate(id);
    }
  };

  const openNewPlanDialog = () => {
    setEditingPlan(null);
    setSelectedProduct(null);
    form.reset({
      productId: 0,
      plannedQuantity: "",
      unit: "",
      weekStartDate: getCurrentWeekRange().start,
      weekEndDate: getCurrentWeekRange().end,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getWeekStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return "upcoming";
    if (now > end) return "past";
    return "current";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "current":
        return <Badge className="bg-green-100 text-green-800">Current Week</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "past":
        return <Badge className="bg-gray-100 text-gray-600">Past</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading weekly stock plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Fixed Back Button in Top-Left */}
      <div className="absolute top-21 left-7 z-50">
        <Link href="/master-inventory">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Weekly Stock Planning
          </h1>
          <p className="text-gray-600 text-center mb-4">
            Plan and manage weekly stock requirements for inventory forecasting
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openNewPlanDialog}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Plan Weekly Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Weekly Stock Plan" : "Create Weekly Stock Plan"}
                </DialogTitle>
                <DialogDescription>
                  Set planned stock quantities for products during specific week periods
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label>Product</Label>
                  {selectedProduct ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600">Unit: {selectedProduct.unit}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          form.setValue("productId", 0);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <ProductSearch
                      onProductSelect={handleProductSelect}
                      placeholder="Search and select a product..."
                    />
                  )}
                  {form.formState.errors.productId && (
                    <p className="text-sm text-red-600">{form.formState.errors.productId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Planned Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="plannedQuantity">Planned Quantity</Label>
                    <Input
                      id="plannedQuantity"
                      type="number"
                      step="0.001"
                      min="0"
                      {...form.register("plannedQuantity")}
                      placeholder="Enter planned quantity"
                    />
                    {form.formState.errors.plannedQuantity && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.plannedQuantity.message}
                      </p>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Controller
                      name="unit"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.unit && (
                      <p className="text-sm text-red-600">{form.formState.errors.unit.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Week Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="weekStartDate">Week Start Date</Label>
                    <Input
                      id="weekStartDate"
                      type="date"
                      {...form.register("weekStartDate")}
                    />
                    {form.formState.errors.weekStartDate && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.weekStartDate.message}
                      </p>
                    )}
                  </div>

                  {/* Week End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="weekEndDate">Week End Date</Label>
                    <Input
                      id="weekEndDate"
                      type="date"
                      {...form.register("weekEndDate")}
                    />
                    {form.formState.errors.weekEndDate && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.weekEndDate.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Add any additional notes about this plan..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  >
                    {createPlanMutation.isPending || updatePlanMutation.isPending
                      ? "Saving..."
                      : editingPlan
                      ? "Update Plan"
                      : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Stock Plans List */}
        {weeklyPlans.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Weekly Stock Plans
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first weekly stock plan to start managing inventory forecasting.
              </p>
              <Button onClick={openNewPlanDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyPlans.map((plan: WeeklyStockPlanWithDetails) => {
              const weekStatus = getWeekStatus(plan.weekStartDate, plan.weekEndDate);
              
              return (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          {plan.product.name}
                        </CardTitle>
                        {getStatusBadge(weekStatus)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          disabled={deletePlanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Planned Quantity:</span>
                      <span className="font-medium">
                        {parseFloat(plan.plannedQuantity).toFixed(3).replace(/\.?0+$/, '')} {plan.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="font-medium">
                        {parseFloat(plan.product.currentStock).toFixed(3).replace(/\.?0+$/, '')} {plan.product.unit}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Week Period:</span>
                      </div>
                      <div className="text-sm font-medium">
                        {formatDate(plan.weekStartDate)} - {formatDate(plan.weekEndDate)}
                      </div>
                    </div>

                    {plan.notes && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {plan.notes}
                        </p>
                      </div>
                    )}

                    {/* Stock Status Indicator */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock Status:</span>
                        {parseFloat(plan.product.currentStock) >= parseFloat(plan.plannedQuantity) ? (
                          <Badge className="bg-green-100 text-green-800">Sufficient</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
