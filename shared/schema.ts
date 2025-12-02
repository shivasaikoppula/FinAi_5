import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(), // income, expense, transfer
  description: text("description"),
  location: text("location"),
  accountId: text("account_id"),
  isFraudulent: boolean("is_fraudulent").default(false).notNull(),
  fraudReason: text("fraud_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: text("period").notNull(), // monthly, weekly, yearly
  status: text("status").default("active").notNull(), // active, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Goals table
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  deadline: timestamp("deadline"),
  type: text("type").notNull(), // emergency_fund, vacation, investment, debt_payoff
  status: text("status").default("active").notNull(), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Health Metrics table
export const financialHealth = pgTable("financial_health", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(), // 0-100
  incomeStability: integer("income_stability").notNull(),
  expenseRatio: integer("expense_ratio").notNull(),
  savingsRate: integer("savings_rate").notNull(),
  debtRatio: integer("debt_ratio").notNull(),
  liquidity: integer("liquidity").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
}).extend({
  monthlyIncome: z.string().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string(),
  date: z.string().or(z.date()),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  currentAmount: true,
  status: true,
}).extend({
  targetAmount: z.string(),
  deadline: z.string().or(z.date()).optional(),
});

// Select types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type FinancialHealth = typeof financialHealth.$inferSelect;

// LLM Fraud Analysis types
export interface FraudPattern {
  pattern: string;
  frequency: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  affectedTransactions: number;
}

export interface DebitCreditAnalysis {
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  largestDebit: { amount: number; merchant: string };
  largestCredit: { amount: number; merchant: string };
  debitCategories: Record<string, number>;
  creditCategories: Record<string, number>;
}

export interface LLMFraudAnalysisResult {
  summary: string;
  fraudPatterns: FraudPattern[];
  debitCreditAnalysis: DebitCreditAnalysis;
  riskAssessment: string;
  recommendations: string[];
  overallFraudRisk: number;
}

// Dataset Processing Types
export interface FraudPatternSummary {
  pattern: string;
  frequency: number;
  associatedFraudRate: number;
}

export interface DatasetStats {
  totalTransactions: number;
  fraudCount: number;
  fraudPercentage: number;
  fraudPatterns: FraudPatternSummary[];
  topMerchants: { name: string; count: number; fraudCount: number }[];
  amountStats: { min: number; max: number; average: number; median: number };
  categoryDistribution: Record<string, number>;
}
