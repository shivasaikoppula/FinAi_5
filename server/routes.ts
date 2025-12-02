import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBudgetSchema, insertGoalSchema } from "@shared/schema";
import { detectFraud, categorizeTransaction } from "./fraud-detection";
import { calculateFinancialHealth } from "./financial-health";
import { analyzeReceiptWithVision, detectFraudIndicatorsFromReceipt } from "./vision-analysis";
import { analyzeFraudWithLLM } from "./llm-fraud-analysis";
import { initializeDatasetPatterns, getPretrainedPatterns } from "./dataset-initialization";
import multer from "multer";
import { parse } from "csv-parse/sync";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Serialize transaction amounts to strings for JSON responses
function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    amount: String(transaction.amount),
    date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
  };
}

function serializeTransactions(transactions: any[]) {
  return transactions.map(serializeTransaction);
}

// Serialize budget amounts to strings
function serializeBudget(budget: any) {
  return {
    ...budget,
    amount: String(budget.amount),
  };
}

function serializeBudgets(budgets: any[]) {
  return budgets.map(serializeBudget);
}

// Serialize goal amounts to strings
function serializeGoal(goal: any) {
  return {
    ...goal,
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount),
    deadline: goal.deadline instanceof Date ? goal.deadline : (goal.deadline ? new Date(goal.deadline) : null),
  };
}

function serializeGoals(goals: any[]) {
  return goals.map(serializeGoal);
}

// Serialize vision analysis results
function serializeVisionAnalysis(visionAnalysis: any) {
  return {
    ...visionAnalysis,
    receiptData: {
      ...visionAnalysis.receiptData,
      amount: String(visionAnalysis.receiptData.amount),
    },
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Disable HTTP caching on all API endpoints to ensure fresh data retrieval
  app.use("/api/", (req: Request, res: Response, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  // Initialize pretrained fraud patterns from IEEE dataset on startup
  try {
    await initializeDatasetPatterns();
  } catch (error) {
    console.warn("Failed to initialize dataset patterns:", error);
  }
  
  // ============ TRANSACTION ROUTES ============
  
  // Get all transactions for a user
  app.get("/api/transactions/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      let transactions;
      if (startDate && endDate) {
        transactions = await storage.getTransactionsByDateRange(
          userId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        transactions = await storage.getTransactionsByUser(userId);
      }

      res.json(serializeTransactions(transactions));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a single transaction
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      
      // Ensure user exists in database (create if not exists)
      let existingUser = await storage.getUser(data.userId);
      if (!existingUser) {
        // Create demo user if it doesn't exist
        await storage.createUser({
          username: data.userId,
          password: '',
          email: `${data.userId}@demo.local`,
        }, data.userId);
      }
      
      // Auto-categorize if no category provided
      if (!data.category || data.category === 'Other') {
        data.category = categorizeTransaction(
          data.merchant,
          parseFloat(data.amount as string)
        );
      }

      // Ensure date is a Date object and handle optional fields
      const transactionData = {
        ...data,
        date: typeof data.date === 'string' ? new Date(data.date) : data.date,
        description: data.description ?? null,
        location: data.location ?? null,
        accountId: data.accountId ?? null,
        isFraudulent: data.isFraudulent ?? false,
        fraudReason: data.fraudReason ?? null,
      };

      // Check for fraud
      const recentTransactions = await storage.getTransactionsByUser(data.userId);
      const fraudCheck = await detectFraud(transactionData, recentTransactions);
      
      if (fraudCheck.isFraudulent) {
        transactionData.isFraudulent = true;
        transactionData.fraudReason = fraudCheck.reason || null;
      }

      const transaction = await storage.createTransaction(transactionData);
      
      // Recalculate financial health after new transaction
      const finalUser = await storage.getUser(data.userId);
      if (finalUser) {
        const allTransactions = await storage.getTransactionsByUser(data.userId);
        const healthMetrics = calculateFinancialHealth(
          allTransactions,
          parseFloat(finalUser.monthlyIncome as string || "0")
        );
        await storage.createOrUpdateFinancialHealth({
          userId: data.userId,
          ...healthMetrics,
        });
      }

      res.status(201).json({ transaction: serializeTransaction(transaction), fraudCheck });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Upload CSV transactions
  app.post("/api/transactions/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      }) as Array<Record<string, string>>;

      // Ensure user exists in database (create if not exists)
      let existingUser = await storage.getUser(userId);
      if (!existingUser) {
        await storage.createUser({
          username: userId,
          password: '',
          email: `${userId}@demo.local`,
        }, userId);
      }

      const createdTransactions = [];
      const fraudulentTransactions = [];

      // Smart type detection for CSV with Gemini AI analysis
      const detectTransactionType = (record: Record<string, string>): "income" | "expense" => {
        // If explicit type provided, use it
        if (record.type && (record.type === 'income' || record.type === 'expense')) {
          return record.type;
        }

        // Check columns for credit/debit keywords first
        const columnNames = Object.keys(record);
        let hasCredit = false;
        let hasDebit = false;

        for (const col of columnNames) {
          const colLower = col.toLowerCase();
          const value = parseFloat(record[col] || '0');

          if (colLower.includes('credit') || colLower.includes('received') || colLower.includes('deposit')) {
            if (value > 0) return 'income';
            hasCredit = true;
          }
          if (colLower.includes('debit') || colLower.includes('withdrawal') || colLower.includes('paid') || colLower.includes('expense')) {
            if (value > 0) return 'expense';
            hasDebit = true;
          }
        }

        // Analyze merchant/description for income keywords
        const merchant = (record.merchant || record.description || '').toLowerCase();
        const incomeKeywords = ['salary', 'income', 'bonus', 'payment received', 'deposit', 'refund', 'transfer in', 'received', 'credit'];
        const expenseKeywords = ['payment', 'purchase', 'withdrawal', 'transfer out', 'expense', 'debit', 'charge', 'fee', 'paid'];

        const matchesIncome = incomeKeywords.some(kw => merchant.includes(kw));
        const matchesExpense = expenseKeywords.some(kw => merchant.includes(kw));

        if (matchesIncome && !matchesExpense) return 'income';
        if (matchesExpense && !matchesIncome) return 'expense';

        // Check amount for negative sign (indicates expense)
        const amountValue = parseFloat(record.amount || '0');
        if (record.amount && record.amount.toString().includes('-')) {
          return 'expense';
        }

        // Default to expense if uncertain
        return 'expense';
      };

      for (const record of records) {
        const detectedType = detectTransactionType(record);
        const category = categorizeTransaction(
          record.merchant || record.description || 'Unknown',
          parseFloat(record.amount || '0')
        );

        // Use today's date if CSV date is missing or invalid
        let csvDate = new Date();
        if (record.date) {
          const parsedDate = new Date(record.date);
          if (!isNaN(parsedDate.getTime())) {
            csvDate = parsedDate;
          }
        }

        const transactionData = {
          userId,
          date: csvDate,
          amount: record.amount || '0',
          merchant: record.merchant || record.description || 'Unknown',
          category: category,
          type: detectedType,
          description: record.description || null,
          location: record.location || null,
          accountId: record.accountId || null,
          isFraudulent: false,
          fraudReason: null,
        };

        const recentTransactions = await storage.getTransactionsByUser(userId);
        const fraudCheck = await detectFraud(transactionData, recentTransactions);

        if (fraudCheck.isFraudulent) {
          transactionData.isFraudulent = true;
          transactionData.fraudReason = (fraudCheck.reason || null) as any;
          fraudulentTransactions.push(transactionData);
        }

        const transaction = await storage.createTransaction(transactionData);
        createdTransactions.push(transaction);
      }

      // Recalculate financial health
      const csvUser = await storage.getUser(userId);
      if (csvUser) {
        const allTransactions = await storage.getTransactionsByUser(userId);
        const healthMetrics = calculateFinancialHealth(
          allTransactions,
          parseFloat(csvUser.monthlyIncome as string || "0")
        );
        await storage.createOrUpdateFinancialHealth({
          userId,
          ...healthMetrics,
        });
      }

      res.status(201).json({
        count: createdTransactions.length,
        created: createdTransactions.length,
        transactions: serializeTransactions(createdTransactions),
        fraudCount: fraudulentTransactions.length,
        fraudulent: serializeTransactions(fraudulentTransactions),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Upload and analyze transaction screenshot with vision API
  app.post("/api/transactions/screenshot", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Ensure user exists in database (create if not exists)
      let screenshotUser = await storage.getUser(userId);
      if (!screenshotUser) {
        await storage.createUser({
          username: userId,
          password: '',
          email: `${userId}@demo.local`,
        }, userId);
      }

      // Convert image to base64 for vision analysis
      const imageBase64 = req.file.buffer.toString('base64');
      const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

      // Analyze receipt using Gemini vision (OCR/NER)
      const visionAnalysis = await analyzeReceiptWithVision(imageBase64, geminiApiKey);
      const receiptData = visionAnalysis.receiptData;

      // Detect fraud indicators from extracted data
      const fraudIndicators = detectFraudIndicatorsFromReceipt(receiptData);
      let isFraudulentFromVision = fraudIndicators.length > 0;

      // Use detected transaction type from OCR (income for "received from", expense for "paid to")
      const detectedType = receiptData.transactionType || "expense";
      
      const transactionData = {
        userId,
        date: new Date(),
        amount: receiptData.amount.toString(),
        merchant: receiptData.merchant,
        category: categorizeTransaction(receiptData.merchant, receiptData.amount),
        type: detectedType as "income" | "expense",
        description: `Receipt scan - Confidence: ${receiptData.confidence}%`,
        location: null,
        accountId: null,
        isFraudulent: isFraudulentFromVision,
        fraudReason: fraudIndicators.length > 0 ? fraudIndicators[0] : null,
      };

      // Additional fraud check using rule-based system
      const recentTransactions = await storage.getTransactionsByUser(userId);
      const fraudCheck = await detectFraud(transactionData, recentTransactions);

      // Combine fraud detection results
      if (fraudCheck.isFraudulent) {
        transactionData.isFraudulent = true;
        transactionData.fraudReason = (fraudCheck.reason as string) || null;
      }

      // Auto-create transaction if we have valid OCR data:
      // - Amount must be greater than 0
      // - Merchant must not be fallback placeholder
      // - Confidence should be reasonable (> 50%)
      let transaction = null;
      const isValidOCR = receiptData.amount > 0 && 
                         receiptData.merchant !== "Receipt Transaction" &&
                         receiptData.merchant !== "Unknown" &&
                         (receiptData.confidence || 0) >= 50;
      
      if (isValidOCR) {
        transaction = await storage.createTransaction(transactionData);
      }

      // Include transaction type in response for frontend color coding
      res.status(201).json({
        transaction: transaction ? serializeTransaction(transaction) : null,
        transactionType: detectedType,
        isFraudulent: transactionData.isFraudulent,
        fraudReason: transactionData.fraudReason,
        visionAnalysis: serializeVisionAnalysis(visionAnalysis),
        fraudCheck,
        fraudIndicators,
        message: transaction 
          ? (transactionData.isFraudulent 
              ? `⚠️ Fraud indicators detected: ${transactionData.fraudReason}` 
              : `✓ ${detectedType === 'income' ? 'Received' : 'Paid'} ₹${receiptData.amount} - Transaction saved`)
          : "Could not extract amount from receipt",
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update transaction
  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const transaction = await storage.updateTransaction(id, updates);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(serializeTransaction(transaction));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ BUDGET ROUTES ============
  
  app.get("/api/budgets/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const budgets = await storage.getBudgetsByUser(userId);
      res.json(serializeBudgets(budgets));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets", async (req: Request, res: Response) => {
    try {
      const data = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(data);
      res.status(201).json(serializeBudget(budget));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/budgets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const budget = await storage.updateBudget(id, req.body);
      
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      res.json(serializeBudget(budget));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/budgets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBudget(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Budget not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ GOAL ROUTES ============
  
  app.get("/api/goals/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const goals = await storage.getGoalsByUser(userId);
      res.json(serializeGoals(goals));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/goals", async (req: Request, res: Response) => {
    try {
      const data = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(data);
      res.status(201).json(serializeGoal(goal));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goal = await storage.updateGoal(id, req.body);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json(serializeGoal(goal));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGoal(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ FINANCIAL HEALTH ROUTES ============
  
  app.get("/api/financial-health/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const health = await storage.getFinancialHealth(userId);
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ANALYTICS ROUTES ============
  
  app.get("/api/analytics/dashboard/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const transactions = await storage.getTransactionsByUser(userId);
      const budgets = await storage.getBudgetsByUser(userId);
      const goals = await storage.getGoalsByUser(userId);
      const health = await storage.getFinancialHealth(userId);

      // Calculate summary metrics
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthTransactions = transactions.filter(
        t => new Date(t.date) >= thisMonthStart
      );

      const totalSpend = thisMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

      const totalIncome = thisMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

      const savings = totalIncome - totalSpend;

      const fraudAlerts = transactions.filter(t => t.isFraudulent).length;

      res.json({
        totalSpend,
        totalIncome,
        savings,
        fraudAlerts,
        activeGoals: goals.filter(g => g.status === 'active').length,
        budgetCount: budgets.length,
        healthScore: health?.score || 0,
        transactionCount: thisMonthTransactions.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/spending-by-category/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const transactions = await storage.getTransactionsByUser(userId);
      const expenses = transactions.filter(t => t.type === 'expense');

      const categoryTotals = expenses.reduce((acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + parseFloat(t.amount as string);
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
      })).sort((a, b) => b.amount - a.amount);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // System status endpoint - Check Gemini API and dataset training status
  app.get("/api/system/status", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      const datasetPatterns = getPretrainedPatterns();
      
      res.json({
        geminiApiConfigured: !!apiKey,
        geminiApiKeyPresent: apiKey ? "configured" : "not_configured",
        datasetTrained: !!datasetPatterns,
        datasetInfo: datasetPatterns ? {
          totalTransactionsAnalyzed: datasetPatterns.totalTransactionsAnalyzed,
          patternsLearned: datasetPatterns.patterns.length,
          fraudPercentage: datasetPatterns.fraudPercentage.toFixed(2) + "%",
          lastUpdated: datasetPatterns.lastUpdated,
          highRiskMerchants: datasetPatterns.highRiskMerchants.length,
          commonFraudIndicators: datasetPatterns.commonFraudIndicators.length,
        } : null,
        message: datasetPatterns 
          ? `System ready: Gemini API ${apiKey ? 'active' : 'inactive'}, IEEE dataset loaded with ${datasetPatterns.totalTransactionsAnalyzed} transactions analyzed`
          : `System ready: Gemini API ${apiKey ? 'active' : 'inactive'}, No pretrained dataset (add ieee-fraud-detection.zip to enable)`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // LLM-powered fraud analysis endpoint
  app.get("/api/fraud-analysis/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "userId is required" });
      }

      const transactions = await storage.getTransactionsByUser(userId);
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

      const analysis = await analyzeFraudWithLLM(transactions, apiKey);
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Fraud analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
