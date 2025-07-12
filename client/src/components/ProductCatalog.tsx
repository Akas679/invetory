import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@/shared/schema";

interface ProductCatalogProps {
  className?: string;
}

export default function ProductCatalog({ className }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/products"],
  });

  // Filter products based on search and filters
  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = unitFilter === "all" || product.unit === unitFilter;
    
    let matchesStock = true;
    if (stockFilter === "in-stock") {
      matchesStock = parseFloat(product.currentStock) > 10;
    } else if (stockFilter === "low-stock") {
      matchesStock = parseFloat(product.currentStock) <= 10 && parseFloat(product.currentStock) > 0;
    } else if (stockFilter === "out-of-stock") {
      matchesStock = parseFloat(product.currentStock) === 0;
    }
    
    return matchesSearch && matchesUnit && matchesStock;
  }) || [];

  // Get unique units for filter dropdown, filtering out empty values
  const availableUnits = [...new Set(products?.map((p: Product) => p.unit).filter(unit => unit && unit.trim() !== '') || [])];

  // Get stock status for a product
  const getStockStatus = (stock: string) => {
    const stockNum = parseFloat(stock);
    if (stockNum === 0) return { status: "out-of-stock", label: "Out of Stock", color: "bg-red-500" };
    if (stockNum <= 10) return { status: "low-stock", label: "Low Stock", color: "bg-yellow-500" };
    return { status: "in-stock", label: "In Stock", color: "bg-green-500" };
  };

  // Format stock display to remove unnecessary decimals
  const formatStock = (stock: string) => {
    const num = parseFloat(stock);
    return num % 1 === 0 ? num.toString() : num.toFixed(3).replace(/\.?0+$/, '');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load products</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Catalog</h2>
          <p className="text-muted-foreground">
            Browse and search all {products?.length || 0} products in inventory
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Unit Filter */}
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit} value={unit || 'unknown'}>
                    {unit || 'Unknown Unit'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="in-stock">In Stock (&gt;10)</SelectItem>
                <SelectItem value="low-stock">Low Stock (1-10)</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || unitFilter !== "all" || stockFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {unitFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Unit: {unitFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setUnitFilter("all")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {stockFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Stock: {stockFilter.replace("-", " ")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setStockFilter("all")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setUnitFilter("all");
                  setStockFilter("all");
                }}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products?.length || 0} products
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            {searchQuery || unitFilter !== "all" || stockFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No products have been added yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => {
            const stockStatus = getStockStatus(product.currentStock);
            return (
              <Card key={product.id} className="modern-card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-start justify-between">
                    <span className="truncate pr-2">{product.name}</span>
                    <div className={`w-3 h-3 rounded-full ${stockStatus.color} shrink-0`} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unit:</span>
                    <Badge variant="outline">{product.unit}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Stock:</span>
                    <span className="font-semibold text-lg">
                      {formatStock(product.currentStock)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge 
                      variant={stockStatus.status === "in-stock" ? "default" : 
                              stockStatus.status === "low-stock" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {stockStatus.label}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Product ID:</span>
                      <span>#{product.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
