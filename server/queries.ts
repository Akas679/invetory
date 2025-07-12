import { db } from "./db";
import { users, products, stockTransactions, weeklyStockPlans, lowStockAlerts } from "@shared/schema";
import {
  eq,
  desc,
  asc,
  and,
  gte,
  lte,
  like,
  ilike,
  sql,
  sum,
  count,
} from "drizzle-orm";
import type {
  User,
  Product,
  StockTransaction,
  WeeklyStockPlan,
  LowStockAlert,
  InsertUser,
  InsertProduct,
  InsertStockTransaction,
  InsertWeeklyStockPlan,
  InsertLowStockAlert,
  UpdateProduct,
  UserRole,
  StockTransactionWithDetails,
  WeeklyStockPlanWithDetails,
  LowStockAlertWithDetails,
} from "@shared/schema";

// ============= USER QUERIES =============

export const userQueries = {
  // Get user by ID
  async getById(id: number): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  },

  // Get user by username
  async getByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  },

  // Create new user
  async create(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  },

  // Update user role
  async updateRole(userId: number, role: UserRole): Promise<User> {
    const result = await db
      .update(users)
      .set({ role, updatedAt: sql`now()` })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  // Update user password
  async updatePassword(userId: number, hashedPassword: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: sql`now()` })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  // Update user status (active/inactive)
  async updateStatus(userId: number, isActive: boolean): Promise<User> {
    const result = await db
      .update(users)
      .set({ isActive: isActive ? 1 : 0, updatedAt: sql`now()` })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  // Get all users
  async getAll(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.username));
  },

  // Get active users only
  async getActive(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, 1))
      .orderBy(asc(users.username));
  },

  // Delete user
  async delete(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  },

  // Get transaction count for user
  async getTransactionCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockTransactions)
      .where(eq(stockTransactions.userId, userId));
    return result[0]?.count || 0;
  },
};

// ============= PRODUCT QUERIES =============

export const productQueries = {
  // Get all products
  async getAll(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  },

  // Get active products only
  async getActive(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, 1))
      .orderBy(asc(products.name));
  },

  // Get product by ID
  async getById(id: number): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  },

  // Create new product
  async create(productData: InsertProduct): Promise<Product> {
    const result = await db
      .insert(products)
      .values({
        ...productData,
        currentStock: productData.openingStock || "0",
      })
      .returning();
    return result[0];
  },

  // Update product
  async update(id: number, productData: UpdateProduct): Promise<Product> {
    const result = await db
      .update(products)
      .set({ ...productData, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  },

  // Update product stock
  async updateStock(id: number, newStock: string): Promise<Product> {
    const result = await db
      .update(products)
      .set({ currentStock: newStock, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  },

  // Search products by name
  async search(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(ilike(products.name, `%${query}%`), eq(products.isActive, 1)))
      .orderBy(asc(products.name))
      .limit(20);
  },

  // Delete product (soft delete by setting isActive to 0)
  async delete(id: number): Promise<void> {
    await db
      .update(products)
      .set({ isActive: 0, updatedAt: sql`now()` })
      .where(eq(products.id, id));
  },

  // Hard delete product
  async hardDelete(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  },

  // Get products with low stock (less than minimum threshold)
  async getLowStock(threshold: number = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          sql`CAST(${products.currentStock} AS DECIMAL) < ${threshold}`,
          eq(products.isActive, 1),
        ),
      )
      .orderBy(asc(sql`CAST(${products.currentStock} AS DECIMAL)`));
  },
};

// ============= STOCK TRANSACTION QUERIES =============

export const stockTransactionQueries = {
  // Create new stock transaction
  async create(
    transactionData: InsertStockTransaction,
  ): Promise<StockTransaction> {
    const result = await db
      .insert(stockTransactions)
      .values([transactionData])
      .returning();
    return result[0];
  },

  // Get all transactions with product and user details
  async getAllWithDetails(filters?: {
    productId?: number;
    type?: "stock_in" | "stock_out";
    userId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<StockTransactionWithDetails[]> {
    // Build conditions array
    const conditions = [];
    if (filters?.productId) {
      conditions.push(eq(stockTransactions.productId, filters.productId));
    }
    if (filters?.type) {
      conditions.push(eq(stockTransactions.type, filters.type));
    }
    if (filters?.userId) {
      conditions.push(eq(stockTransactions.userId, filters.userId));
    }
    if (filters?.fromDate) {
      conditions.push(gte(stockTransactions.transactionDate, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(stockTransactions.transactionDate, filters.toDate));
    }

    // Build the query with or without conditions
    const baseQuery = db
      .select({
        id: stockTransactions.id,
        productId: stockTransactions.productId,
        userId: stockTransactions.userId,
        type: stockTransactions.type,
        quantity: stockTransactions.quantity,
        previousStock: stockTransactions.previousStock,
        newStock: stockTransactions.newStock,

        transactionDate: stockTransactions.transactionDate,
        soNumber: stockTransactions.soNumber,
        poNumber: stockTransactions.poNumber,
        createdAt: stockTransactions.createdAt,
        originalQuantity: stockTransactions.originalQuantity,
        originalUnit: stockTransactions.originalUnit,
        product: {
          id: products.id,
          name: products.name,
          unit: products.unit,
          openingStock: products.openingStock,
          currentStock: products.currentStock,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .leftJoin(users, eq(stockTransactions.userId, users.id));

    const finalQuery =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    return await finalQuery.orderBy(desc(stockTransactions.transactionDate));
  },

  // Get transactions by product ID
  async getByProductId(
    productId: number,
  ): Promise<StockTransactionWithDetails[]> {
    return await this.getAllWithDetails({ productId });
  },

  // Get transactions by user ID
  async getByUserId(userId: number): Promise<StockTransactionWithDetails[]> {
    return await this.getAllWithDetails({ userId });
  },

  // Get transactions by type
  async getByType(
    type: "stock_in" | "stock_out",
  ): Promise<StockTransactionWithDetails[]> {
    return await this.getAllWithDetails({ type });
  },

  // Get transactions for date range
  async getByDateRange(
    fromDate: Date,
    toDate: Date,
  ): Promise<StockTransactionWithDetails[]> {
    return await this.getAllWithDetails({ fromDate, toDate });
  },

  // Get today's transactions
  async getToday(): Promise<StockTransactionWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.getAllWithDetails({ fromDate: today, toDate: tomorrow });
  },

  // Get recent transactions (last N days)
  async getRecent(days: number = 7): Promise<StockTransactionWithDetails[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await this.getAllWithDetails({ fromDate });
  },
};

// ============= DASHBOARD/ANALYTICS QUERIES =============

export const dashboardQueries = {
  // Get dashboard statistics
  async getStats(): Promise<{
    totalProducts: number;
    totalStock: number;
    todayStockIn: number;
    todayStockOut: number;
    activeProducts: number;
    lowStockProducts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total products count
    const totalProductsResult = await db
      .select({ count: count() })
      .from(products);

    // Active products count
    const activeProductsResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, 1));

    // Total stock value (sum of all current stock)
    const totalStockResult = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${products.currentStock} AS DECIMAL)), 0)`,
      })
      .from(products)
      .where(eq(products.isActive, 1));

    // Today's stock in
    const todayStockInResult = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .where(
        and(
          eq(stockTransactions.type, "stock_in"),
          gte(stockTransactions.transactionDate, today),
          lte(stockTransactions.transactionDate, tomorrow),
        ),
      );

    // Today's stock out
    const todayStockOutResult = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .where(
        and(
          eq(stockTransactions.type, "stock_out"),
          gte(stockTransactions.transactionDate, today),
          lte(stockTransactions.transactionDate, tomorrow),
        ),
      );

    // Low stock products (less than 10 units)
    const lowStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          sql`CAST(${products.currentStock} AS DECIMAL) < 10`,
          eq(products.isActive, 1),
        ),
      );

    return {
      totalProducts: totalProductsResult[0]?.count || 0,
      activeProducts: activeProductsResult[0]?.count || 0,
      totalStock: Number(totalStockResult[0]?.total) || 0,
      todayStockIn: Number(todayStockInResult[0]?.total) || 0,
      todayStockOut: Number(todayStockOutResult[0]?.total) || 0,
      lowStockProducts: lowStockResult[0]?.count || 0,
    };
  },

  // Get monthly stock movement
  async getMonthlyMovement(
    year: number,
    month: number,
  ): Promise<{
    stockIn: number;
    stockOut: number;
    netMovement: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stockInResult = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .where(
        and(
          eq(stockTransactions.type, "stock_in"),
          gte(stockTransactions.transactionDate, startDate),
          lte(stockTransactions.transactionDate, endDate),
        ),
      );

    const stockOutResult = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .where(
        and(
          eq(stockTransactions.type, "stock_out"),
          gte(stockTransactions.transactionDate, startDate),
          lte(stockTransactions.transactionDate, endDate),
        ),
      );

    const stockIn = Number(stockInResult[0]?.total) || 0;
    const stockOut = Number(stockOutResult[0]?.total) || 0;

    return {
      stockIn,
      stockOut,
      netMovement: stockIn - stockOut,
    };
  },

  // Get detailed inventory analytics
  async getInventoryAnalytics(): Promise<{
    productsByCategory: Array<{
      category: string;
      count: number;
      totalStock: number;
    }>;
    topMovingProducts: Array<{
      productId: number;
      productName: string;
      totalMovement: number;
    }>;
    stockDistribution: Array<{ range: string; count: number }>;
    monthlyTrends: Array<{
      month: string;
      stockIn: number;
      stockOut: number;
      net: number;
    }>;
  }> {
    // Products by unit category
    const categoryData = await db
      .select({
        category: products.unit,
        count: count(),
        totalStock: sql`COALESCE(SUM(CAST(${products.currentStock} AS DECIMAL)), 0)`,
      })
      .from(products)
      .where(eq(products.isActive, 1))
      .groupBy(products.unit);

    // Top moving products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topMovingData = await db
      .select({
        productId: stockTransactions.productId,
        productName: products.name,
        totalMovement: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .where(gte(stockTransactions.transactionDate, thirtyDaysAgo))
      .groupBy(stockTransactions.productId, products.name)
      .orderBy(
        sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0) DESC`,
      )
      .limit(10);

    // Stock level distribution
    const stockRanges = [
      { range: "0", min: 0, max: 0 },
      { range: "1-10", min: 1, max: 10 },
      { range: "11-50", min: 11, max: 50 },
      { range: "51-100", min: 51, max: 100 },
      { range: "100+", min: 101, max: 999999 },
    ];

    const stockDistribution = await Promise.all(
      stockRanges.map(async (range) => {
        const result = await db
          .select({ count: count() })
          .from(products)
          .where(
            and(
              eq(products.isActive, 1),
              sql`CAST(${products.currentStock} AS DECIMAL) >= ${range.min}`,
              sql`CAST(${products.currentStock} AS DECIMAL) <= ${range.max}`,
            ),
          );
        return { range: range.range, count: result[0]?.count || 0 };
      }),
    );

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await db
      .select({
        month: sql`DATE_TRUNC('month', ${stockTransactions.transactionDate})`,
        type: stockTransactions.type,
        total: sql`COALESCE(SUM(CAST(${stockTransactions.quantity} AS DECIMAL)), 0)`,
      })
      .from(stockTransactions)
      .where(gte(stockTransactions.transactionDate, sixMonthsAgo))
      .groupBy(
        sql`DATE_TRUNC('month', ${stockTransactions.transactionDate})`,
        stockTransactions.type,
      )
      .orderBy(sql`DATE_TRUNC('month', ${stockTransactions.transactionDate})`);

    // Process monthly trends
    const monthlyTrends = new Map();
    monthlyData.forEach((row) => {
      const month = new Date(row.month as string).toISOString().slice(0, 7);
      if (!monthlyTrends.has(month)) {
        monthlyTrends.set(month, { month, stockIn: 0, stockOut: 0, net: 0 });
      }
      const trend = monthlyTrends.get(month);
      if (row.type === "stock_in") {
        trend.stockIn = Number(row.total);
      } else {
        trend.stockOut = Number(row.total);
      }
      trend.net = trend.stockIn - trend.stockOut;
    });

    return {
      productsByCategory: categoryData.map((row) => ({
        category: row.category,
        count: row.count,
        totalStock: Number(row.totalStock),
      })),
      topMovingProducts: topMovingData.map((row) => ({
        productId: row.productId,
        productName: row.productName || "Unknown",
        totalMovement: Number(row.totalMovement),
      })),
      stockDistribution,
      monthlyTrends: Array.from(monthlyTrends.values()),
    };
  },
};

// ============= TRANSACTION HELPERS =============

export const transactionHelpers = {
  // Process stock in transaction
  async processStockIn(
    productId: number,
    userId: number,
    quantity: string,
    transactionDate: Date,
    remarks?: string,
    poNumber?: string,
    originalQuantity?: string,
    originalUnit?: string,
  ): Promise<{ transaction: StockTransaction; product: Product }> {
    return await db.transaction(async (tx) => {
      // Get current product
      const currentProduct = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!currentProduct[0]) {
        throw new Error("Product not found");
      }

      const previousStock = currentProduct[0].currentStock;
      const newStock = (
        parseFloat(previousStock) + parseFloat(quantity)
      ).toString();

      // Update product stock
      const updatedProduct = await tx
        .update(products)
        .set({ currentStock: newStock, updatedAt: sql`now()` })
        .where(eq(products.id, productId))
        .returning();

      // Create transaction record
      const transaction = await tx
        .insert(stockTransactions)
        .values({
          productId,
          userId,
          type: "stock_in",
          quantity,
          originalQuantity,
          originalUnit,
          previousStock,
          newStock,
          transactionDate,
          poNumber,
          soNumber: null,
        })
        .returning();

      return {
        transaction: transaction[0],
        product: updatedProduct[0],
      };
    });
  },

  // Process stock out transaction
  async processStockOut(
    productId: number,
    userId: number,
    quantity: string,
    transactionDate: Date,
    soNumber?: string,
    originalQuantity?: string,
    originalUnit?: string,
  ): Promise<{ transaction: StockTransaction; product: Product }> {
    return await db.transaction(async (tx) => {
      // Get current product
      const currentProduct = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!currentProduct[0]) {
        throw new Error("Product not found");
      }

      const previousStock = currentProduct[0].currentStock;
      const currentStockNum = parseFloat(previousStock);
      const quantityNum = parseFloat(quantity);

      if (currentStockNum < quantityNum) {
        throw new Error(
          `Insufficient stock. Available: ${currentStockNum}, Requested: ${quantityNum}`,
        );
      }

      const newStock = (currentStockNum - quantityNum).toString();

      // Update product stock
      const updatedProduct = await tx
        .update(products)
        .set({ currentStock: newStock, updatedAt: sql`now()` })
        .where(eq(products.id, productId))
        .returning();

      // Create transaction record
      const transaction = await tx
        .insert(stockTransactions)
        .values({
          productId,
          userId,
          type: "stock_out",
          quantity,
          originalQuantity,
          originalUnit,
          previousStock,
          newStock,
          transactionDate,
          soNumber,
          poNumber: null,
        })
        .returning();

      return {
        transaction: transaction[0],
        product: updatedProduct[0],
      };
    });
  },
};

// ============= WEEKLY STOCK PLANNING QUERIES =============

export const weeklyStockPlanQueries = {
  // Get all weekly stock plans
  async getAll(): Promise<WeeklyStockPlanWithDetails[]> {
    return await db
      .select({
        id: weeklyStockPlans.id,
        productId: weeklyStockPlans.productId,
        userId: weeklyStockPlans.userId,
        plannedQuantity: weeklyStockPlans.plannedQuantity,
        unit: weeklyStockPlans.unit,
        weekStartDate: weeklyStockPlans.weekStartDate,
        weekEndDate: weeklyStockPlans.weekEndDate,
        isActive: weeklyStockPlans.isActive,
        notes: weeklyStockPlans.notes,
        createdAt: weeklyStockPlans.createdAt,
        updatedAt: weeklyStockPlans.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          unit: products.unit,
          openingStock: products.openingStock,
          currentStock: products.currentStock,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(weeklyStockPlans)
      .leftJoin(products, eq(weeklyStockPlans.productId, products.id))
      .leftJoin(users, eq(weeklyStockPlans.userId, users.id))
      .where(eq(weeklyStockPlans.isActive, true))
      .orderBy(desc(weeklyStockPlans.weekStartDate));
  },

  // Get weekly plans by date range
  async getByWeekRange(startDate: Date, endDate: Date): Promise<WeeklyStockPlanWithDetails[]> {
    return await db
      .select({
        id: weeklyStockPlans.id,
        productId: weeklyStockPlans.productId,
        userId: weeklyStockPlans.userId,
        plannedQuantity: weeklyStockPlans.plannedQuantity,
        unit: weeklyStockPlans.unit,
        weekStartDate: weeklyStockPlans.weekStartDate,
        weekEndDate: weeklyStockPlans.weekEndDate,
        isActive: weeklyStockPlans.isActive,
        notes: weeklyStockPlans.notes,
        createdAt: weeklyStockPlans.createdAt,
        updatedAt: weeklyStockPlans.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          unit: products.unit,
          openingStock: products.openingStock,
          currentStock: products.currentStock,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(weeklyStockPlans)
      .leftJoin(products, eq(weeklyStockPlans.productId, products.id))
      .leftJoin(users, eq(weeklyStockPlans.userId, users.id))
      .where(
        and(
          eq(weeklyStockPlans.isActive, true),
          gte(weeklyStockPlans.weekStartDate, startDate.toISOString().split('T')[0]),
          lte(weeklyStockPlans.weekEndDate, endDate.toISOString().split('T')[0])
        )
      );
  },

  // Get current week plans
  async getCurrentWeekPlans(): Promise<WeeklyStockPlanWithDetails[]> {
    const now = new Date();
    const currentDateString = now.toISOString().split('T')[0];
    
    return await db
      .select({
        id: weeklyStockPlans.id,
        productId: weeklyStockPlans.productId,
        userId: weeklyStockPlans.userId,
        plannedQuantity: weeklyStockPlans.plannedQuantity,
        unit: weeklyStockPlans.unit,
        weekStartDate: weeklyStockPlans.weekStartDate,
        weekEndDate: weeklyStockPlans.weekEndDate,
        isActive: weeklyStockPlans.isActive,
        notes: weeklyStockPlans.notes,
        createdAt: weeklyStockPlans.createdAt,
        updatedAt: weeklyStockPlans.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          unit: products.unit,
          openingStock: products.openingStock,
          currentStock: products.currentStock,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(weeklyStockPlans)
      .leftJoin(products, eq(weeklyStockPlans.productId, products.id))
      .leftJoin(users, eq(weeklyStockPlans.userId, users.id))
      .where(
        and(
          eq(weeklyStockPlans.isActive, true),
          lte(weeklyStockPlans.weekStartDate, currentDateString),
          gte(weeklyStockPlans.weekEndDate, currentDateString)
        )
      );
  },

  // Create weekly stock plan
  async create(planData: InsertWeeklyStockPlan): Promise<WeeklyStockPlan> {
    const result = await db
      .insert(weeklyStockPlans)
      .values(planData)
      .returning();
    return result[0];
  },

  // Update weekly stock plan
  async update(id: number, planData: Partial<InsertWeeklyStockPlan>): Promise<WeeklyStockPlan> {
    const result = await db
      .update(weeklyStockPlans)
      .set({ ...planData, updatedAt: sql`now()` })
      .where(eq(weeklyStockPlans.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Weekly stock plan not found");
    }
    return result[0];
  },

  // Delete (deactivate) weekly stock plan
  async delete(id: number): Promise<void> {
    await db
      .update(weeklyStockPlans)
      .set({ isActive: false, updatedAt: sql`now()` })
      .where(eq(weeklyStockPlans.id, id));
  },

  // Check for low stock alerts based on current week plans
  async checkLowStockAlerts(): Promise<Array<{
    productId: number;
    productName: string;
    currentStock: number;
    plannedQuantity: number;
    weeklyPlanId: number;
    unit: string;
  }>> {
    const currentWeekPlans = await this.getCurrentWeekPlans();
    const lowStockItems = [];

    for (const plan of currentWeekPlans) {
      const currentStock = parseFloat(plan.product.currentStock);
      const plannedQuantity = parseFloat(plan.plannedQuantity);

      if (currentStock < plannedQuantity) {
        lowStockItems.push({
          productId: plan.productId,
          productName: plan.product.name,
          currentStock,
          plannedQuantity,
          weeklyPlanId: plan.id,
          unit: plan.unit,
        });
      }
    }

    return lowStockItems;
  },
};

// ============= LOW STOCK ALERT QUERIES =============

export const lowStockAlertQueries = {
  // Get all unresolved alerts
  async getUnresolvedAlerts(): Promise<LowStockAlertWithDetails[]> {
    return await db
      .select({
        id: lowStockAlerts.id,
        productId: lowStockAlerts.productId,
        weeklyPlanId: lowStockAlerts.weeklyPlanId,
        currentStock: lowStockAlerts.currentStock,
        plannedQuantity: lowStockAlerts.plannedQuantity,
        alertLevel: lowStockAlerts.alertLevel,
        isResolved: lowStockAlerts.isResolved,
        alertDate: lowStockAlerts.alertDate,
        resolvedAt: lowStockAlerts.resolvedAt,
        createdAt: lowStockAlerts.createdAt,
        product: {
          id: products.id,
          name: products.name,
          unit: products.unit,
          openingStock: products.openingStock,
          currentStock: products.currentStock,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        weeklyPlan: {
          id: weeklyStockPlans.id,
          productId: weeklyStockPlans.productId,
          userId: weeklyStockPlans.userId,
          plannedQuantity: weeklyStockPlans.plannedQuantity,
          unit: weeklyStockPlans.unit,
          weekStartDate: weeklyStockPlans.weekStartDate,
          weekEndDate: weeklyStockPlans.weekEndDate,
          isActive: weeklyStockPlans.isActive,
          notes: weeklyStockPlans.notes,
          createdAt: weeklyStockPlans.createdAt,
          updatedAt: weeklyStockPlans.updatedAt,
        },
      })
      .from(lowStockAlerts)
      .leftJoin(products, eq(lowStockAlerts.productId, products.id))
      .leftJoin(weeklyStockPlans, eq(lowStockAlerts.weeklyPlanId, weeklyStockPlans.id))
      .where(eq(lowStockAlerts.isResolved, false))
      .orderBy(desc(lowStockAlerts.alertDate));
  },

  // Create low stock alert
  async create(alertData: InsertLowStockAlert): Promise<LowStockAlert> {
    const result = await db
      .insert(lowStockAlerts)
      .values(alertData)
      .returning();
    return result[0];
  },

  // Resolve alert
  async resolve(id: number): Promise<LowStockAlert> {
    const result = await db
      .update(lowStockAlerts)
      .set({ isResolved: true, resolvedAt: sql`now()` })
      .where(eq(lowStockAlerts.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Alert not found");
    }
    return result[0];
  },

  // Process automatic low stock checking
  async processLowStockChecking(): Promise<LowStockAlert[]> {
    const lowStockItems = await weeklyStockPlanQueries.checkLowStockAlerts();
    const newAlerts = [];

    for (const item of lowStockItems) {
      // Check if alert already exists for this product and week
      const existingAlert = await db
        .select()
        .from(lowStockAlerts)
        .where(
          and(
            eq(lowStockAlerts.productId, item.productId),
            eq(lowStockAlerts.weeklyPlanId, item.weeklyPlanId),
            eq(lowStockAlerts.isResolved, false)
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        // Create new alert
        const alert = await this.create({
          productId: item.productId,
          weeklyPlanId: item.weeklyPlanId,
          currentStock: item.currentStock.toString(),
          plannedQuantity: item.plannedQuantity.toString(),
          alertLevel: item.currentStock <= (item.plannedQuantity * 0.5) ? "critical" : "low",
          alertDate: new Date(),
        });
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  },
};
