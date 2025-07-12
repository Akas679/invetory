import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import HomeNew from "@/pages/Home-new";
import Inventory from "@/pages/Inventory";
import MasterInventory from "@/pages/MasterInventory";
import StockManagement from "@/pages/StockManagement";
import TransactionLog from "@/pages/TransactionLog";
import UserManagement from "@/pages/UserManagement";
import WeeklyStockPlanning from "@/pages/WeeklyStockPlanning";
import ProductCatalogPage from "@/pages/ProductCatalogPage";

import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
{/*           <Route path="/" component={Login} />
          <Route path="/login" component={Login} /> */}
          <Route component={Login} />
        </>
      ) : (
        <Layout>
          <Switch>
            <Route
              path="/"
              component={() => {
                // Redirect non-super admin users to their specific pages
                const userRole = (user as any)?.role;

                if (
                  userRole === "stock_in_manager" ||
                  userRole === "stock_out_manager"
                ) {
                  return <StockManagement />;
                }
                if (userRole === "master_inventory_handler") {
                  return <HomeNew />;
                }
                return <HomeNew />;
              }}
            />
            <Route path="/inventory" component={Inventory} />
            <Route path="/master-inventory" component={MasterInventory} />
            <Route path="/stock-management" component={StockManagement} />
            <Route path="/transactions" component={TransactionLog} />
            <Route path="/users" component={UserManagement} />
            <Route path="/weekly-stock-planning" component={WeeklyStockPlanning} />
            <Route path="/product-catalog" component={ProductCatalogPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" />

        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;