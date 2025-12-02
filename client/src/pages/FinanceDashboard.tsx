import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import FinanceNavbar from "@/components/FinanceNavbar";
import HealthScoreCard from "@/components/HealthScoreCard";
import TransactionCard from "@/components/TransactionCard";
import BudgetCard from "@/components/BudgetCard";
import GoalCard from "@/components/GoalCard";
import BudgetUpdateModal from "@/components/BudgetUpdateModal";
import GoalUpdateModal from "@/components/GoalUpdateModal";
import FraudAlert from "@/components/FraudAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, BarChart3, Target } from "lucide-react";
import { formatINR } from "@/lib/currency";
import type { Transaction, Budget, Goal, FinancialHealth } from "@shared/schema";

export default function FinanceDashboard() {
  const [, setLocation] = useLocation();
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userId = currentUser?.id || "";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userId) {
      setLocation("/");
    }
  }, [userId, setLocation]);

  if (!userId) {
    return null;
  }

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userId],
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery<Budget[]>({
    queryKey: ['/api/budgets', userId],
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery<Goal[]>({
    queryKey: ['/api/goals', userId],
  });

  const { data: healthData } = useQuery<FinancialHealth>({
    queryKey: ['/api/financial-health', userId],
  });

  // Calculate dashboard metrics - show all transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || "0")), 0);

  const totalSpend = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || "0")), 0);

  // Monthly transactions for filtering (current month only)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const savings = totalIncome - totalSpend;

  const fraudulentTransactions = transactions.filter(t => t.isFraudulent);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate budget metrics
  const budgetMetrics = budgets.map(budget => {
    const categoryTransactions = monthlyTransactions.filter(
      t => t.category === budget.category && t.type === 'expense'
    );
    const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      category: budget.category,
      spent,
      limit: parseFloat(budget.amount),
      period: budget.period,
    };
  });

  if (loadingTransactions || loadingBudgets || loadingGoals) {
    return (
      <div className="min-h-screen bg-background">
        <FinanceNavbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading your financial data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FinanceNavbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="font-serif font-bold text-4xl md:text-5xl">
              Financial Dashboard
            </h1>
            <div className="h-1 w-12 bg-gradient-to-r from-accent to-primary rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-lg">
            Your complete financial overview at a glance
          </p>
        </div>

        {/* Fraud Alerts */}
        {fraudulentTransactions.length > 0 && (
          <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {fraudulentTransactions.slice(0, 3).map((transaction) => (
              <FraudAlert
                key={transaction.id}
                merchant={transaction.merchant}
                amount={transaction.amount}
                reason={transaction.fraudReason || "Suspicious activity detected"}
                onDismiss={() => console.log('Fraud dismissed')}
                onConfirm={() => console.log('Transaction confirmed legitimate')}
              />
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Income Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-accent/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <Card className="relative hover-elevate active-elevate-2 border-0 bg-gradient-to-br from-green-50 dark:from-green-950/20 to-accent/5 dark:to-accent/10">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Money received</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">
                  ₹{formatINR(totalIncome)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-destructive/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <Card className="relative hover-elevate active-elevate-2 border-0 bg-gradient-to-br from-red-50 dark:from-red-950/20 to-destructive/5 dark:to-destructive/10">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Money spent</p>
                </div>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-red-600 dark:text-red-400">
                  ₹{formatINR(totalSpend)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-primary/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <Card className="relative hover-elevate active-elevate-2 border-0 bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-primary/5 dark:to-primary/10">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}% rate</p>
                </div>
                <div className={`p-2 rounded-lg ${savings >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-destructive/20'}`}>
                  <Wallet className={`h-5 w-5 ${savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold font-mono ${savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
                  ₹{formatINR(Math.abs(savings))}
                </div>
              </CardContent>
            </Card>
          </div>

          {healthData ? (
            <HealthScoreCard
              score={healthData.score}
              components={{
                incomeStability: healthData.incomeStability,
                expenseRatio: healthData.expenseRatio,
                savingsRate: healthData.savingsRate,
                debtRatio: healthData.debtRatio,
                liquidity: healthData.liquidity,
              }}
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  Add more transactions to calculate your health score
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
                <ArrowRight className="h-5 w-5 text-accent" />
              </div>
              <h2 className="font-serif font-bold text-2xl">Recent Transactions</h2>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    className="animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <TransactionCard
                      id={transaction.id}
                      merchant={transaction.merchant}
                      amount={transaction.amount}
                      category={transaction.category}
                      date={new Date(transaction.date)}
                      type={transaction.type as "income" | "expense"}
                      isFraudulent={transaction.isFraudulent}
                      isInINR={transaction.description?.includes("Receipt scan") || false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/30">
                <CardContent className="py-16 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet. Add your first transaction to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Budgets and Goals */}
          <div className="space-y-8">
            {/* Budget Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-xl">Budget Overview</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBudgetModalOpen(true)}
                  className="gap-1 hover-elevate"
                  data-testid="button-update-budget"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {budgetMetrics.length > 0 ? (
                <div className="space-y-3">
                  {budgetMetrics.slice(0, 3).map((budget, idx) => (
                    <div
                      key={idx}
                      className="animate-in fade-in slide-in-from-right-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <BudgetCard {...budget} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-muted/30">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No budgets yet. Create your first budget to track spending.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Goals Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-xl">Active Goals</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGoalModalOpen(true)}
                  className="gap-1 hover-elevate"
                  data-testid="button-update-goal"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.filter(g => g.status === 'active').slice(0, 2).map((goal, idx) => (
                    <div
                      key={goal.id}
                      className="animate-in fade-in slide-in-from-right-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <GoalCard
                        name={goal.name}
                        current={parseFloat(goal.currentAmount)}
                        target={parseFloat(goal.targetAmount)}
                        deadline={goal.deadline ? new Date(goal.deadline) : undefined}
                        type={goal.type as any}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-muted/30">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No goals yet. Set a financial goal to stay motivated.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <BudgetUpdateModal 
            open={budgetModalOpen} 
            onOpenChange={setBudgetModalOpen} 
            userId={userId}
          />
          <GoalUpdateModal 
            open={goalModalOpen} 
            onOpenChange={setGoalModalOpen} 
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
