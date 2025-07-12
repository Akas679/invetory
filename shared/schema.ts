import {
  pgTable,
  text,
  varchar,
  timestamp,
  json,
  index,
  serial,
  integer,
  decimal,
  pgEnum,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 30 }).notNull().default("stock_in_manager"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // KG, Litre, Pieces, etc.
  openingStock: decimal("opening_stock", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock transactions table
export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 10 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  originalQuantity: decimal("original_quantity", { precision: 10, scale: 2 }),
  originalUnit: varchar("original_unit", { length: 50 }),
  previousStock: decimal("previous_stock", {
    precision: 10,
    scale: 2,
  }).notNull(),
  newStock: decimal("new_stock", { precision: 10, scale: 2 }).notNull(),

  transactionDate: timestamp("transaction_date").notNull(),
  soNumber: varchar("so_number", { length: 100 }),
  poNumber: varchar("po_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly stock plans table
export const weeklyStockPlans = pgTable("weekly_stock_plans", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  plannedQuantity: decimal("planned_quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Low stock alerts table
export const lowStockAlerts = pgTable("low_stock_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  weeklyPlanId: integer("weekly_plan_id")
    .notNull()
    .references(() => weeklyStockPlans.id),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  plannedQuantity: decimal("planned_quantity", { precision: 10, scale: 2 }).notNull(),
  alertLevel: varchar("alert_level", { length: 20 }).notNull().default("low"), // low, critical
  isResolved: boolean("is_resolved").notNull().default(false),
  alertDate: timestamp("alert_date").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(stockTransactions),
  weeklyStockPlans: many(weeklyStockPlans),
}));

export const productsRelations = relations(products, ({ many }) => ({
  transactions: many(stockTransactions),
  weeklyStockPlans: many(weeklyStockPlans),
  lowStockAlerts: many(lowStockAlerts),
}));

export const stockTransactionsRelations = relations(
  stockTransactions,
  ({ one }) => ({
    product: one(products, {
      fields: [stockTransactions.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [stockTransactions.userId],
      references: [users.id],
    }),
  }),
);

export const weeklyStockPlansRelations = relations(
  weeklyStockPlans,
  ({ one, many }) => ({
    product: one(products, {
      fields: [weeklyStockPlans.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [weeklyStockPlans.userId],
      references: [users.id],
    }),
    lowStockAlerts: many(lowStockAlerts),
  }),
);

export const lowStockAlertsRelations = relations(
  lowStockAlerts,
  ({ one }) => ({
    product: one(products, {
      fields: [lowStockAlerts.productId],
      references: [products.id],
    }),
    weeklyPlan: one(weeklyStockPlans, {
      fields: [lowStockAlerts.weeklyPlanId],
      references: [weeklyStockPlans.id],
    }),
  }),
);

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  currentStock: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockTransactionSchema = createInsertSchema(
  stockTransactions,
).omit({
  id: true,
  previousStock: true,
  newStock: true,
  createdAt: true,
  transactionDate: true,
});

export const stockInSchema = insertStockTransactionSchema.extend({
  poNumber: z.string().optional(),
});

export const stockOutSchema = insertStockTransactionSchema
  .extend({
    soNumber: z.string().optional(),
  })
  .omit({
    quantity: true,
  })
  .extend({
    quantityOut: z.string().min(1, "Quantity out is required"),
  });

export const updateProductSchema = createInsertSchema(products)
  .omit({
    currentStock: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const insertWeeklyStockPlanSchema = createInsertSchema(weeklyStockPlans).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts).omit({
  id: true,
  isResolved: true,
  resolvedAt: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<
  typeof insertStockTransactionSchema
>;
export type WeeklyStockPlan = typeof weeklyStockPlans.$inferSelect;
export type InsertWeeklyStockPlan = z.infer<typeof insertWeeklyStockPlanSchema>;
export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = z.infer<typeof insertLowStockAlertSchema>;

// Extended types with relations
export type ProductWithTransactions = Product & {
  transactions: StockTransaction[];
};

export type StockTransactionWithDetails = StockTransaction & {
  product: Product;
  user: User;
};

export type WeeklyStockPlanWithDetails = WeeklyStockPlan & {
  product: Product;
  user: User;
};

export type LowStockAlertWithDetails = LowStockAlert & {
  product: Product;
  weeklyPlan: WeeklyStockPlan;
};

export type UserRole =
  | "super_admin"
  | "master_inventory_handler"
  | "stock_in_manager"
  | "stock_out_manager"
  | "attendance_manager";
