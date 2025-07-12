import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
}

export default function ProductSearch({ 
  onProductSelect, 
  placeholder = "Search and select product..." 
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/search", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  useEffect(() => {
    setIsDropdownOpen(searchQuery.length > 0 && !selectedProduct);
  }, [searchQuery, selectedProduct]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setIsDropdownOpen(false);
    onProductSelect(product);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setSelectedProduct(null);
  };

  const handleInputFocus = () => {
    if (searchQuery && !selectedProduct) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events on dropdown items
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 text-lg"
        />
      </div>

      {isDropdownOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 shadow-lg">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              Searching...
            </div>
          ) : products?.length > 0 ? (
            <div className="py-2">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {product.unit} - Current Stock: {product.currentStock}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-3 text-center text-gray-500">
              No products found
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
