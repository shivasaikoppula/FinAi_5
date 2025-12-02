import {
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type Goal,
  type InsertGoal,
  type FinancialHealth,
  users,
  transactions,
  budgets,
  goals,
  financialHealth,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, customId?: string): Promise<User>;
  
  // Transaction methods
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Budget methods
  getBudget(id: string): Promise<Budget | undefined>;
  getBudgetsByUser(userId: string): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;
  
  // Goal methods
  getGoal(id: string): Promise<Goal | undefined>;
  getGoalsByUser(userId: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  
  // Financial Health methods
  getFinancialHealth(userId: string): Promise<FinancialHealth | undefined>;
  createOrUpdateFinancialHealth(health: Omit<FinancialHealth, "id" | "calculatedAt">): Promise<FinancialHealth>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private budgets: Map<string, Budget>;
  private goals: Map<string, Goal>;
  private financialHealth: Map<string, FinancialHealth>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    this.financialHealth = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser, customId?: string): Promise<User> {
    const id = customId || randomUUID();
    const user: User = {
      ...insertUser,
      id,
      monthlyIncome: insertUser.monthlyIncome || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => {
        const transDate = new Date(t.date);
        return t.userId === userId && transDate >= startDate && transDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      ...insertTransaction,
      date: typeof insertTransaction.date === 'string' ? new Date(insertTransaction.date) : insertTransaction.date,
      isFraudulent: insertTransaction.isFraudulent || false,
      fraudReason: insertTransaction.fraudReason || null,
      description: insertTransaction.description || null,
      location: insertTransaction.location || null,
      accountId: insertTransaction.accountId || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Budget methods
  async getBudget(id: string): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async getBudgetsByUser(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter((b) => b.userId === userId);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      id,
      ...insertBudget,
      status: 'active',
      deletedAt: null,
      createdAt: new Date(),
    } as any;
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updated = { ...budget, ...updates };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const budget = this.budgets.get(id);
    if (!budget) return false;
    
    const updated = { ...budget, status: 'deleted', deletedAt: new Date() } as any;
    this.budgets.set(id, updated);
    return true;
  }

  // Goal methods
  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async getGoalsByUser(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter((g) => g.userId === userId);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = {
      id,
      name: insertGoal.name,
      targetAmount: insertGoal.targetAmount,
      type: insertGoal.type,
      userId: insertGoal.userId,
      currentAmount: "0",
      status: "active",
      deadline: insertGoal.deadline ? (typeof insertGoal.deadline === 'string' ? new Date(insertGoal.deadline) : insertGoal.deadline) : null,
      createdAt: new Date(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updated = { ...goal, ...updates };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const goal = this.goals.get(id);
    if (!goal) return false;
    
    const updated = { ...goal, status: 'deleted' };
    this.goals.set(id, updated);
    return true;
  }

  // Financial Health methods
  async getFinancialHealth(userId: string): Promise<FinancialHealth | undefined> {
    return Array.from(this.financialHealth.values()).find((fh) => fh.userId === userId);
  }

  async createOrUpdateFinancialHealth(
    health: Omit<FinancialHealth, "id" | "calculatedAt">
  ): Promise<FinancialHealth> {
    const existing = await this.getFinancialHealth(health.userId);
    
    if (existing) {
      const updated: FinancialHealth = {
        ...existing,
        ...health,
        calculatedAt: new Date(),
      };
      this.financialHealth.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const newHealth: FinancialHealth = {
      id,
      ...health,
      calculatedAt: new Date(),
    };
    this.financialHealth.set(id, newHealth);
    return newHealth;
  }
}

// PostgreSQL Storage using Drizzle ORM
export class PostgresStorage implements IStorage {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser, customId?: string): Promise<User> {
    const result = await this.db
      .insert(users)
      .values({
        ...(customId ? { id: customId } : {}),
        ...insertUser,
        monthlyIncome: insertUser.monthlyIncome || null,
      })
      .returning();
    return result[0];
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await this.db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db
      .insert(transactions)
      .values({
        ...insertTransaction,
        date: typeof insertTransaction.date === 'string' ? new Date(insertTransaction.date) : insertTransaction.date,
      })
      .returning();
    return result[0];
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await this.db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await this.db.delete(transactions).where(eq(transactions.id, id));
    return true;
  }

  // Budget methods
  async getBudget(id: string): Promise<Budget | undefined> {
    const result = await this.db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
    return result[0];
  }

  async getBudgetsByUser(userId: string): Promise<Budget[]> {
    return this.db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const result = await this.db.insert(budgets).values(insertBudget).returning();
    return result[0];
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    const result = await this.db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, id))
      .returning();
    return result[0];
  }

  async deleteBudget(id: string): Promise<boolean> {
    const result = await this.db
      .update(budgets)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return result.length > 0;
  }

  // Goal methods
  async getGoal(id: string): Promise<Goal | undefined> {
    const result = await this.db.select().from(goals).where(eq(goals.id, id)).limit(1);
    return result[0];
  }

  async getGoalsByUser(userId: string): Promise<Goal[]> {
    return this.db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const goalData = {
      ...insertGoal,
      deadline: insertGoal.deadline ? (typeof insertGoal.deadline === 'string' ? new Date(insertGoal.deadline) : insertGoal.deadline) : null,
    };
    const result = await this.db.insert(goals).values(goalData).returning();
    return result[0];
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const result = await this.db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return result[0];
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await this.db
      .update(goals)
      .set({ status: 'deleted' })
      .where(eq(goals.id, id))
      .returning();
    return result.length > 0;
  }

  // Financial Health methods
  async getFinancialHealth(userId: string): Promise<FinancialHealth | undefined> {
    const result = await this.db
      .select()
      .from(financialHealth)
      .where(eq(financialHealth.userId, userId))
      .limit(1);
    return result[0];
  }

  async createOrUpdateFinancialHealth(
    health: Omit<FinancialHealth, "id" | "calculatedAt">
  ): Promise<FinancialHealth> {
    const existing = await this.getFinancialHealth(health.userId);

    if (existing) {
      const result = await this.db
        .update(financialHealth)
        .set(health)
        .where(eq(financialHealth.id, existing.id))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(financialHealth).values(health).returning();
    return result[0];
  }
}

// Initialize storage based on environment
const initializeStorage = (): IStorage => {
  if (process.env.DATABASE_URL) {
    const db = drizzle(process.env.DATABASE_URL, { schema });
    return new PostgresStorage(db);
  }
  return new MemStorage();
};

export const storage = initializeStorage();
