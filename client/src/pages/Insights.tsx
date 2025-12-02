import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import FinanceNavbar from "@/components/FinanceNavbar";
import FraudAnalysisDisplay from "@/components/FraudAnalysisDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction, Budget, LLMFraudAnalysisResult } from "@shared/schema";

export default function Insights() {
  const [, setLocation] = useLocation();

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userId = currentUser?.id || "";

  if (!userId) {
    setLocation("/");
    return null;
  }

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userId],
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery<Budget[]>({
    queryKey: ['/api/budgets', userId],
  });

  const { data: fraudAnalysis, isLoading: loadingFraudAnalysis } = useQuery<LLMFraudAnalysisResult>({
    queryKey: ['/api/fraud-analysis', userId],
  });

  // Spending by category
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category;
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount || "0"));
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(categorySpending)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  // Monthly spending trends
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    const amount = Math.abs(parseFloat(t.amount || "0"));
    if (t.type === 'income') {
      monthlyData[monthKey].income += amount;
    } else {
      monthlyData[monthKey].expense += amount;
    }
  });

  const trendData = Object.entries(monthlyData)
    .sort((a, b) => {
      const [aMonth, aYear] = a[0].split('/').map(Number);
      const [bMonth, bYear] = b[0].split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    })
    .slice(-6)
    .map(([month, data]) => ({
      month,
      income: parseFloat(data.income.toFixed(2)),
      expense: parseFloat(data.expense.toFixed(2)),
    }));

  // Budget vs Actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const budgetComparison = budgets.map(budget => {
    const spent = monthlyTransactions
      .filter(t => t.category === budget.category && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || "0")), 0);
    return {
      category: budget.category,
      budget: parseFloat(budget.amount),
      spent: parseFloat(spent.toFixed(2)),
    };
  });

  // Fraud statistics
  const fraudTransactions = transactions.filter(t => t.isFraudulent);
  const totalFraudAmount = fraudTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || "0")), 0);

  // Top spending categories
  const topCategories = categoryData.slice(0, 5);

  const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6'];

  if (loadingTransactions || loadingBudgets || loadingFraudAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <FinanceNavbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FinanceNavbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">
            Financial Insights
          </h1>
          <p className="text-muted-foreground">
            Deep analysis of your spending patterns, fraud detection, and financial trends
          </p>
        </div>

        {/* Tabs for different insights sections */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="analytics">Spending Analytics</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Analysis</TabsTrigger>
          </TabsList>

          {/* Spending Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Spending Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topCategories.length > 0 ? topCategories[0].name : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{topCategories.length > 0 ? topCategories[0].value.toFixed(2) : '0.00'} spent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {fraudTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{totalFraudAmount.toFixed(2)} at risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories Tracked</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(categorySpending).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total spending categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  No spending data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget vs Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget vs Actual (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${typeof value === 'number' ? value.toFixed(2) : value}`} />
                    <Legend />
                    <Bar dataKey="budget" fill="#8b5cf6" />
                    <Bar dataKey="spent" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  No budget data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expense Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                No transaction history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Categories Table */}
            {topCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 5 Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <span className="font-mono font-semibold">₹{cat.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Fraud Analysis Tab */}
          <TabsContent value="fraud">
            {fraudAnalysis ? (
              <FraudAnalysisDisplay analysis={fraudAnalysis} />
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  No fraud analysis data available
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
