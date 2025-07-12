
import { Button } from "@/components/ui/button";
import { Package, Calendar, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MasterInventory() {
  const { user } = useAuth();
  
  // Debug: Log the current user and their role
  console.log("MasterInventory page - Current user:", user);
  console.log("MasterInventory page - User role:", (user as any)?.role);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back to Home Button */}
        <div className="absolute top-21 left-10 z-60">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Master Inventory Selection
          </h1>
          <p className="text-xl text-gray-600">
            Manage products, plan weekly stock, or browse catalog
          </p>
          <p className="text-sm text-green-600 mt-2 font-medium">
            ✓ You are on the Master Inventory page - Role: {(user as any)?.role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Manage Products */}
          <Link href="/inventory?direct=true">
            <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-8 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-medium text-blue-800 mb-3">Manage Products</h3>
                <p className="text-gray-600 text-lg mb-3">
                  Create and manage inventory products
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  Click to manage products
                </p>
              </div>
            </div>
          </Link>

          {/* Plan Weekly Stock */}
          <Link href="/weekly-stock-planning">
            <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-8 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-medium text-green-800 mb-3">Plan Weekly Stock</h3>
                <p className="text-gray-600 text-lg mb-3">
                  Set weekly stock requirements
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Click to plan weekly stock
                </p>
              </div>
            </div>
          </Link>

          {/* Product Catalog */}
          <Link href="/product-catalog">
            <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background rounded-lg border p-8 hover:bg-accent hover:shadow-md transition-all cursor-pointer">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-medium text-purple-800 mb-3">Product Catalog</h3>
                <p className="text-gray-600 text-lg mb-3">
                  Browse all products with search and filter options
                </p>
                <p className="text-sm text-purple-600 font-medium">
                  Click to view catalog
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
