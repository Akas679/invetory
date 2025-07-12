import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, Edit, Loader2 } from "lucide-react";

export interface ProductTransactionData {
  product: string;
  unit: string;
  currentStock: string;
  quantity: string;
  newStock: string;
  displayQuantity?: string;
}

export interface TransactionData {
  type: string;
  products: ProductTransactionData[];
  date: string;
  remarks?: string;
  soNumber?: string;
  poNumber?: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  title: string;
  transactionData: TransactionData;
  isLoading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onEdit,
  title,
  transactionData,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Format number to maximum 3 decimal places
  const formatDecimal = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    // Remove trailing zeros and limit to 3 decimal places
    const formatted = num.toFixed(3);
    return parseFloat(formatted).toString();
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    setIsConfirmed(false);
  };

  const handleEdit = () => {
    setIsConfirmed(false);
    onEdit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="transaction-details">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4" id="transaction-details">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Transaction Type:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {transactionData.type}
              </Badge>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium text-gray-600">Date:</span>
              <span className="text-gray-900">{transactionData.date}</span>
            </div>
            {transactionData.soNumber && (
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-gray-600">SO Number:</span>
                <span className="text-gray-900">{transactionData.soNumber}</span>
              </div>
            )}
            {transactionData.poNumber && transactionData.type === 'Stock In' && (
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-gray-600">PO Number:</span>
                <span className="text-gray-900">{transactionData.poNumber}</span>
              </div>
            )}
            {transactionData.remarks && (
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-gray-600">Remarks:</span>
                <span className="text-gray-900">{transactionData.remarks}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Products ({transactionData.products.length}):</h4>
            {transactionData.products.map((product, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-900">{product.product}</div>
                <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <span className="text-gray-600">Current:</span>
                    <div className="font-medium">{formatDecimal(product.currentStock)} {product.unit}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <div className="font-medium text-blue-600">
                      {product.displayQuantity ? (
                        <div>
                          <div>{product.displayQuantity}</div>
                          <div className="text-xs text-gray-500">({formatDecimal(product.quantity)} {product.unit})</div>
                        </div>
                      ) : (
                        <div>{formatDecimal(product.quantity)} {product.unit}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">New Stock:</span>
                    <div className="font-bold text-green-600">{formatDecimal(product.newStock)} {product.unit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 py-3">
          <Checkbox
            id="confirm-checkbox"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked === true)}
          />
          <label
            htmlFor="confirm-checkbox"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I confirm that the above details are correct
          </label>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Transaction
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirm Transaction
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
