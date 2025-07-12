import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Edit, Trash2, Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertProductSchema,
  updateProductSchema,
  type Product,
} from "@shared/schema";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  openingStock: z.string().min(1, "Opening stock is required"),
});

const updateFormSchema = updateProductSchema.extend({
  openingStock: z.string().min(1, "Opening stock is required"),
});

export default function Inventory() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the inventory.",
        variant: "destructive",
      });
      return;
    }
  }, [isLoading, isAuthenticated, toast]);

  const addForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      unit: "",
      openingStock: "",
    },
  });

  const editForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      name: "",
      unit: "",
      openingStock: "",
    },
  });

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && !!user,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      addForm.reset();
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof updateFormSchema>;
    }) => {
      await apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      editForm.reset();
      setEditingProduct(null);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    editForm.reset({
      name: product.name,
      unit: product.unit,
      openingStock: product.openingStock,
    });
  };

  const handleDelete = (id: number) => {
    deleteProductMutation.mutate(id);
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product: Product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // Format number to display without unnecessary decimal zeros
  const formatDecimal = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return num % 1 === 0
      ? num.toString()
      : num.toFixed(3).replace(/\.?0+$/, "");
  };

  const getStockStatus = (currentStock: string) => {
    const stock = parseFloat(currentStock);
    if (stock === 0) return { label: "Out of Stock", color: "destructive" };
    if (stock < 20) return { label: "Low Stock", color: "warning" };
    return { label: "Available", color: "success" };
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

  // Check if user has access
  const hasAccess = user && 
    ['super_admin', 'master_inventory_handler', 'stock_in_manager'].includes((user as any)?.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access the inventory management
              system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect Master Inventory Handler if they accessed /inventory directly without ?direct=true
  const userRole = (user as any)?.role;
  const hasDirectParam = new URLSearchParams(window.location.search).has('direct');
  
  if (userRole === 'master_inventory_handler' && !hasDirectParam) {
    console.log("Redirecting Master Inventory Handler to proper flow");
    // Redirect to Master Inventory page to see the two cards first
    window.location.href = '/master-inventory';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Redirecting to Master Inventory...</p>
        </div>
      </div>
    );
  }

  // Show the actual form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Fixed Back Button in Top-Left */}
      {new URLSearchParams(window.location.search).has('direct') ? (
        <div className="absolute top-21 left-7 z-50">
          <Link href="/master-inventory">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>← Back to Master Inventory</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="fixed top-6 left-6 z-50">
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>← Back to Home</span>
            </Button>
          </Link>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4">
        {/* Remove the old button container here */}
        {/* <div className="flex justify-between items-center mb-8"> ... </div> */}
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add New Product
          </h1>
          <p className="text-gray-600">Create new inventory items</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit((data) =>
                  createProductMutation.mutate(data),
                )}
                className="space-y-6"
              >
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          {...field}
                          className="h-12 text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">
                        Unit of Measurement
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="Grams">Grams</SelectItem>
                          <SelectItem value="Litre">Litre</SelectItem>
                          <SelectItem value="Millilitre">
                            Millilitre
                          </SelectItem>
                          <SelectItem value="Pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="openingStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Opening Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Enter opening quantity"
                          {...field}
                          className="h-12 text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="h-12 px-8 text-lg"
                  >
                    {createProductMutation.isPending
                      ? "Adding..."
                      : "Add Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
