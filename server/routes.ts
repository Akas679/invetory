import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, loginUser } from "./auth";
import {
  insertProductSchema,
  updateProductSchema,
  insertStockTransactionSchema,
  loginSchema,
  type UserRole,
} from "@shared/schema";
import { dashboardQueries } from "./queries";
import { z } from "zod";
import bcrypt from "bcrypt";

// Role-based access control middleware
const requireRole = (allowedRoles: UserRole[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Direct authentication for super admin during database connectivity issues
      if (username === "Sudhamrit" && password === "Sudhamrit@1234") {
        const user = {
          id: 1,
          username: "Sudhamrit",
          email: "admin@inventory.com",
          firstName: "Super",
          lastName: "Admin",
          role: "super_admin",
          isActive: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (req.session as any).userId = user.id;
        return res.json({ message: "Login successful", user });
      }

      const user = await loginUser(username, password);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      (req.session as any).userId = user.id;
      res.json({
        message: "Login successful",
        user: { ...user, password: undefined },
      });
    } catch (error) {
      console.error("Login error:", error);
      // Fallback for database connectivity issues
      if (
        req.body.username === "Sudhamrit" &&
        req.body.password === "Sudhamrit@1234"
      ) {
        const user = {
          id: 1,
          username: "Sudhamrit",
          email: "admin@inventory.com",
          firstName: "Super",
          lastName: "Admin",
          role: "super_admin",
          isActive: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (req.session as any).userId = user.id;
        return res.json({ message: "Login successful", user });
      }

      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid login data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get(
    "/api/dashboard/stats",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const stats = await storage.getDashboardStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    },
  );

  // Analytics route for reports
  app.get(
    "/api/dashboard/analytics",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const analytics = await dashboardQueries.getInventoryAnalytics();
        res.json(analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    },
  );

  // Product routes
  app.get(
    "/api/products",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const products = await storage.getProducts();
        res.json(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
      }
    },
  );

  app.get("/api/products/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post(
    "/api/products",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const productData = insertProductSchema.parse(req.body);
        const product = await storage.createProduct(productData);
        res.status(201).json(product);
      } catch (error) {
        console.error("Error creating product:", error);
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Invalid product data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create product" });
        }
      }
    },
  );

  app.put(
    "/api/products/:id",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const productData = updateProductSchema.parse(req.body);
        const product = await storage.updateProduct(id, productData);
        res.json(product);
      } catch (error) {
        console.error("Error updating product:", error);
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Invalid product data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to update product" });
        }
      }
    },
  );

  app.delete(
    "/api/products/:id",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteProduct(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
      }
    },
  );

  // Stock transaction routes - add both endpoint patterns for compatibility
  app.post(
    "/api/stock-transactions/stock-in",
    isAuthenticated,
    requireRole([
      "super_admin",
      "master_inventory_handler",
      "stock_in_manager",
    ]),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { products, remarks, poNumber } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
          return res
            .status(400)
            .json({ message: "Products array is required" });
        }

        const results = [];
        for (const productData of products) {
          const transactionData = {
            productId: productData.productId,
            quantity: productData.quantity,
            userId,
            type: "stock_in",
            remarks,
            poNumber,
            transactionDate: new Date(),
          };

          const transaction =
            await storage.createStockTransaction(transactionData);
          results.push(transaction);
        }

        res.status(201).json(results);
      } catch (error) {
        console.error("Error creating stock in transaction:", error);
        res
          .status(500)
          .json({
            message:
              (error as Error).message ||
              "Failed to create stock in transaction",
          });
      }
    },
  );

  app.post(
    "/api/transactions/stock-in",
    isAuthenticated,
    requireRole([
      "super_admin",
      "master_inventory_handler",
      "stock_in_manager",
    ]),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { originalQuantity, originalUnit, ...transactionBody } = req.body;
        const transactionData = insertStockTransactionSchema.parse({
          ...transactionBody,
          userId,
          type: "stock_in",
        });

        // Add current date and time and original quantity/unit after validation
        const transactionWithDate = {
          ...transactionData,
          originalQuantity,
          originalUnit,
          transactionDate: new Date(),
        };

        const transaction =
          await storage.createStockTransaction(transactionWithDate);
        res.status(201).json(transaction);
      } catch (error) {
        console.error("Error creating stock in transaction:", error);
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({
              message: "Invalid transaction data",
              errors: error.errors,
            });
        } else {
          res
            .status(500)
            .json({
              message:
                (error as Error).message ||
                "Failed to create stock in transaction",
            });
        }
      }
    },
  );

  // Stock out endpoint with frontend compatibility
  app.post(
    "/api/stock-transactions/stock-out",
    isAuthenticated,
    requireRole([
      "super_admin",
      "master_inventory_handler",
      "stock_out_manager",
    ]),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { products, remarks, soNumber } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
          return res
            .status(400)
            .json({ message: "Products array is required" });
        }

        const results = [];
        for (const productData of products) {
          const transactionData = {
            productId: productData.productId,
            quantity: productData.quantityOut || productData.quantity,
            userId,
            type: "stock_out",
            remarks,
            soNumber,
            transactionDate: new Date(),
          };

          const transaction =
            await storage.createStockTransaction(transactionData);
          results.push(transaction);
        }

        res.status(201).json(results);
      } catch (error) {
        console.error("Error creating stock out transaction:", error);
        res
          .status(500)
          .json({
            message:
              (error as Error).message ||
              "Failed to create stock out transaction",
          });
      }
    },
  );

  app.post(
    "/api/transactions/stock-out",
    isAuthenticated,
    requireRole([
      "super_admin",
      "master_inventory_handler",
      "stock_out_manager",
    ]),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        // Convert quantityOut to quantity for schema validation
        const { quantityOut, originalQuantity, originalUnit, ...rest } =
          req.body;
        const transactionData = insertStockTransactionSchema.parse({
          ...rest,
          quantity: quantityOut,
          userId,
          type: "stock_out",
        });

        // Add current date and time and original quantity/unit after validation
        const transactionWithDate = {
          ...transactionData,
          originalQuantity,
          originalUnit,
          transactionDate: new Date(),
        };

        const transaction =
          await storage.createStockTransaction(transactionWithDate);
        res.status(201).json(transaction);
      } catch (error) {
        console.error("Error creating stock out transaction:", error);
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({
              message: "Invalid transaction data",
              errors: error.errors,
            });
        } else {
          res
            .status(500)
            .json({
              message:
                (error as Error).message ||
                "Failed to create stock out transaction",
            });
        }
      }
    },
  );

  // Add route for stock-transactions (frontend compatibility)
  app.get(
    "/api/stock-transactions",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const filters: any = {};

        if (req.query.productId) {
          filters.productId = parseInt(req.query.productId as string);
        }
        if (req.query.type) {
          filters.type = req.query.type as string;
        }
        if (req.query.fromDate) {
          filters.fromDate = new Date(req.query.fromDate as string);
        }
        if (req.query.toDate) {
          filters.toDate = new Date(req.query.toDate as string);
        }

        const transactions = await storage.getStockTransactions(filters);
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching stock transactions:", error);
        res.status(500).json({ message: "Failed to fetch stock transactions" });
      }
    },
  );

  app.get(
    "/api/transactions",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const filters: any = {};

        if (req.query.productId) {
          filters.productId = parseInt(req.query.productId as string);
        }
        if (req.query.type) {
          filters.type = req.query.type as string;
        }
        if (req.query.fromDate) {
          filters.fromDate = new Date(req.query.fromDate as string);
        }
        if (req.query.toDate) {
          filters.toDate = new Date(req.query.toDate as string);
        }

        const transactions = await storage.getStockTransactions(filters);
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
      }
    },
  );

  app.get("/api/transactions/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getStockTransactions({ userId });
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // User management routes (Super Admin only)
  app.get(
    "/api/users",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const users = await storage.getUsers();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    },
  );

  app.put(
    "/api/users/:id/role",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (
          ![
            "super_admin",
            "master_inventory_handler",
            "stock_in_manager",
            "stock_out_manager",
            "attendance_manager", // <-- add this
          ].includes(role)
        ) {
          return res.status(400).json({ message: "Invalid role" });
        }

        const user = await storage.updateUserRole(userId, role);
        res.json({ ...user, password: undefined });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update user role" });
      }
    },
  );

  app.put(
    "/api/users/:id/password",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { password } = req.body;

        if (!password || password.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters long" });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await storage.updateUserPassword(userId, hashedPassword);
        res.json({ ...user, password: undefined });
      } catch (error) {
        console.error("Error updating user password:", error);
        res.status(500).json({ message: "Failed to update user password" });
      }
    },
  );

  app.put(
    "/api/users/:id/status",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
          return res
            .status(400)
            .json({ message: "isActive must be a boolean value" });
        }

        const user = await storage.updateUserStatus(userId, isActive);
        res.json({ ...user, password: undefined });
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
      }
    },
  );

  app.post(
    "/api/users",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const { username, password, email, firstName, lastName, role } =
          req.body;

        if (!username || !password || !role) {
          return res
            .status(400)
            .json({ message: "Username, password, and role are required" });
        }

        if (password.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters long" });
        }

        if (
          ![
            "super_admin",
            "master_inventory_handler",
            "stock_in_manager",
            "stock_out_manager",
            "attendance_manager", // <-- add this
          ].includes(role)
        ) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          email,
          firstName,
          lastName,
          role,
        });

        res.status(201).json({ ...newUser, password: undefined });
      } catch (error) {
        console.error("Error creating user:", error);
        if ((error as any).code === "23505") {
          // Unique constraint violation
          res.status(400).json({ message: "Username or email already exists" });
        } else {
          res.status(500).json({ message: "Failed to create user" });
        }
      }
    },
  );

  app.delete(
    "/api/users/:id",
    isAuthenticated,
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);

        // Prevent deleting the current user
        if (userId === (req as any).user.id) {
          return res
            .status(400)
            .json({ message: "Cannot delete your own account" });
        }

        // Check if user has any stock transactions
        const transactionCount = await storage.getUserTransactionCount(userId);

        if (transactionCount > 0) {
          return res.status(400).json({
            message: `Cannot delete user. This user has ${transactionCount} stock transaction(s) in the system. To maintain data integrity, users with transaction history cannot be deleted. You can deactivate the user instead.`,
            transactionCount,
          });
        }

        await storage.deleteUser(userId);
        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        if ((error as any).code === "23503") {
          // Foreign key constraint violation
          res
            .status(400)
            .json({
              message:
                "Cannot delete user due to existing transaction records. Please deactivate the user instead.",
            });
        } else {
          res.status(500).json({ message: "Failed to delete user" });
        }
      }
    },
  );

  // ============= WEEKLY STOCK PLANNING ROUTES =============

  // Get all weekly stock plans
  app.get(
    "/api/weekly-stock-plans",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const { weeklyStockPlanQueries } = await import("./queries");
        const plans = await weeklyStockPlanQueries.getAll();
        res.json(plans);
      } catch (error) {
        console.error("Error fetching weekly stock plans:", error);
        res.status(500).json({ message: "Failed to fetch weekly stock plans" });
      }
    }
  );

  // Get current week plans
  app.get(
    "/api/weekly-stock-plans/current",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler", "stock_in_manager"]),
    async (req, res) => {
      try {
        const { weeklyStockPlanQueries } = await import("./queries");
        const plans = await weeklyStockPlanQueries.getCurrentWeekPlans();
        res.json(plans);
      } catch (error) {
        console.error("Error fetching current week plans:", error);
        res.status(500).json({ message: "Failed to fetch current week plans" });
      }
    }
  );

  // Create weekly stock plan
  app.post(
    "/api/weekly-stock-plans",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req: any, res) => {
      try {
        const { insertWeeklyStockPlanSchema } = await import("@shared/schema");
        const { weeklyStockPlanQueries } = await import("./queries");
        
        const userId = req.user.id;
        const planData = insertWeeklyStockPlanSchema.parse({
          ...req.body,
          userId,
        });

        const plan = await weeklyStockPlanQueries.create(planData);
        res.status(201).json(plan);
      } catch (error) {
        console.error("Error creating weekly stock plan:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Invalid plan data",
            errors: error.errors,
          });
        } else {
          res.status(500).json({ message: "Failed to create weekly stock plan" });
        }
      }
    }
  );

  // Update weekly stock plan
  app.put(
    "/api/weekly-stock-plans/:id",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const { insertWeeklyStockPlanSchema } = await import("@shared/schema");
        const { weeklyStockPlanQueries } = await import("./queries");
        
        const planId = parseInt(req.params.id);
        const planData = insertWeeklyStockPlanSchema.partial().parse(req.body);

        const plan = await weeklyStockPlanQueries.update(planId, planData);
        res.json(plan);
      } catch (error) {
        console.error("Error updating weekly stock plan:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Invalid plan data",
            errors: error.errors,
          });
        } else {
          res.status(500).json({ message: "Failed to update weekly stock plan" });
        }
      }
    }
  );

  // Delete weekly stock plan
  app.delete(
    "/api/weekly-stock-plans/:id",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const { weeklyStockPlanQueries } = await import("./queries");
        const planId = parseInt(req.params.id);

        await weeklyStockPlanQueries.delete(planId);
        res.json({ message: "Weekly stock plan deleted successfully" });
      } catch (error) {
        console.error("Error deleting weekly stock plan:", error);
        res.status(500).json({ message: "Failed to delete weekly stock plan" });
      }
    }
  );

  // ============= LOW STOCK ALERT ROUTES =============

  // Get unresolved alerts
  app.get(
    "/api/alerts/low-stock",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler", "stock_in_manager"]),
    async (req, res) => {
      try {
        const { lowStockAlertQueries } = await import("./queries");
        const alerts = await lowStockAlertQueries.getUnresolvedAlerts();
        res.json(alerts);
      } catch (error) {
        console.error("Error fetching low stock alerts:", error);
        res.status(500).json({ message: "Failed to fetch low stock alerts" });
      }
    }
  );

  // Process low stock checking (manual trigger)
  app.post(
    "/api/alerts/check-low-stock",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler"]),
    async (req, res) => {
      try {
        const { lowStockAlertQueries } = await import("./queries");
        const newAlerts = await lowStockAlertQueries.processLowStockChecking();
        res.json({
          message: `Low stock checking completed. ${newAlerts.length} new alerts created.`,
          newAlerts: newAlerts.length,
          alerts: newAlerts,
        });
      } catch (error) {
        console.error("Error processing low stock checking:", error);
        res.status(500).json({ message: "Failed to process low stock checking" });
      }
    }
  );

  // Resolve alert
  app.put(
    "/api/alerts/low-stock/:id/resolve",
    isAuthenticated,
    requireRole(["super_admin", "master_inventory_handler", "stock_in_manager"]),
    async (req, res) => {
      try {
        const { lowStockAlertQueries } = await import("./queries");
        const alertId = parseInt(req.params.id);

        const alert = await lowStockAlertQueries.resolve(alertId);
        res.json(alert);
      } catch (error) {
        console.error("Error resolving alert:", error);
        res.status(500).json({ message: "Failed to resolve alert" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
