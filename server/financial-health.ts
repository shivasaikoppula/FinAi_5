import { type Transaction } from "@shared/schema";

export interface HealthScoreComponents {
  score: number;
  incomeStability: number;
  expenseRatio: number;
  savingsRate: number;
  debtRatio: number;
  liquidity: number;
}

export function calculateFinancialHealth(
  transactions: Transaction[],
  monthlyIncome: number = 0
): HealthScoreComponents {
  if (transactions.length === 0 || monthlyIncome === 0) {
    return {
      score: 50,
      incomeStability: 50,
      expenseRatio: 50,
      savingsRate: 50,
      debtRatio: 50,
      liquidity: 50,
    };
  }

  // Calculate metrics from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = transactions.filter(
    (t) => new Date(t.date) >= threeMonthsAgo
  );

  // Income stability (based on regular income transactions)
  const incomeTransactions = recentTransactions.filter((t) => t.type === "income");
  const incomeStability = incomeTransactions.length >= 3 ? 85 : Math.min(incomeTransactions.length * 20, 100);

  // Expense ratio (expenses vs income)
  const expenses = recentTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

  const expenseRatioValue = monthlyIncome > 0 ? (expenses / (monthlyIncome * 3)) : 1;
  const expenseRatio = Math.max(0, 100 - expenseRatioValue * 100);

  // Savings rate
  const income = recentTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

  const savingsAmount = income - expenses;
  const savingsRateValue = income > 0 ? savingsAmount / income : 0;
  const savingsRate = Math.max(0, Math.min(100, savingsRateValue * 100));

  // Debt ratio (assuming debt-related categories)
  const debtPayments = recentTransactions
    .filter(
      (t) =>
        t.category.toLowerCase().includes("loan") ||
        t.category.toLowerCase().includes("debt") ||
        t.category.toLowerCase().includes("credit")
    )
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

  const debtRatioValue = monthlyIncome > 0 ? debtPayments / (monthlyIncome * 3) : 0;
  const debtRatio = Math.max(0, 100 - debtRatioValue * 100);

  // Liquidity (based on expense coverage - assuming liquid funds = savings)
  const monthlyExpenses = expenses / 3;
  const liquidityMonths = savingsAmount > 0 ? savingsAmount / monthlyExpenses : 0;
  const liquidity = Math.min(100, (liquidityMonths / 6) * 100); // 6 months = 100%

  // Overall score (weighted average)
  const score = Math.round(
    incomeStability * 0.20 +
    expenseRatio * 0.25 +
    savingsRate * 0.25 +
    debtRatio * 0.15 +
    liquidity * 0.15
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    incomeStability: Math.round(incomeStability),
    expenseRatio: Math.round(expenseRatio),
    savingsRate: Math.round(savingsRate),
    debtRatio: Math.round(debtRatio),
    liquidity: Math.round(liquidity),
  };
}
