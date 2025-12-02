import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import FinanceNavbar from "@/components/FinanceNavbar";
import BudgetCard from "@/components/BudgetCard";
import GoalCard from "@/components/GoalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Budget, Goal, Transaction } from "@shared/schema";

export default function BudgetsGoals() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userId = currentUser?.id || "";

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery<Budget[]>({
    queryKey: ['/api/budgets', userId],
    enabled: !!userId,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery<Goal[]>({
    queryKey: ['/api/goals', userId],
    enabled: !!userId,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userId],
    enabled: !!userId,
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/budgets', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', userId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId], refetchType: 'all' });
      setShowBudgetDialog(false);
      toast({
        title: "Budget created",
        description: "Your budget has been set successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/goals', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId], refetchType: 'all' });
      setShowGoalDialog(false);
      toast({
        title: "Goal created",
        description: "Your financial goal has been set successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', userId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId], refetchType: 'all' });
      toast({
        title: "Budget removed",
        description: "Your budget has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId], refetchType: 'active' });
      toast({
        title: "Goal removed",
        description: "Your goal has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userId) {
      setLocation("/");
    }
  }, [userId, setLocation]);

  if (!userId) {
    return null;
  }

  // Calculate budget metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const activeBudgets = budgets.filter(b => (b as any).status !== 'deleted');
  const deletedBudgets = budgets.filter(b => (b as any).status === 'deleted');
  const deletedGoals = goals.filter(g => g.status === 'deleted');
  const activeGoals = goals.filter(g => g.status === 'active');

  const budgetMetrics = activeBudgets
    .filter(b => b.period === 'monthly')
    .map(budget => {
      const categoryTransactions = monthlyTransactions.filter(
        t => t.category === budget.category && t.type === 'expense'
      );
      const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        id: budget.id,
        category: budget.category,
        spent,
        limit: parseFloat(budget.amount),
        period: budget.period,
      };
    });

  const deletedBudgetMetrics = deletedBudgets
    .filter(b => b.period === 'monthly')
    .map(budget => {
      const categoryTransactions = monthlyTransactions.filter(
        t => t.category === budget.category && t.type === 'expense'
      );
      const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        id: budget.id,
        category: budget.category,
        spent,
        limit: parseFloat(budget.amount),
        period: budget.period,
      };
    });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBudgetMutation.mutate({
      userId,
      category: formData.get('category'),
      amount: formData.get('amount'),
      period: formData.get('period'),
    });
  };

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createGoalMutation.mutate({
      userId,
      name: formData.get('name'),
      targetAmount: formData.get('targetAmount'),
      type: formData.get('type'),
      deadline: formData.get('deadline') || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <FinanceNavbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">
            Budgets & Goals
          </h1>
          <p className="text-muted-foreground">
            Track your spending and achieve your financial goals
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Budgets Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-semibold text-2xl">Monthly Budgets</h2>
              <Button
                onClick={() => setShowBudgetDialog(true)}
                className="gap-2"
                data-testid="button-create-budget"
              >
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
            </div>
            {loadingBudgets ? (
              <div className="text-muted-foreground">Loading budgets...</div>
            ) : budgetMetrics.length > 0 ? (
              <div className="space-y-4">
                {budgetMetrics.map((budget) => (
                  <BudgetCard 
                    key={budget.id} 
                    {...budget}
                    onDelete={() => deleteBudgetMutation.mutate(budget.id!)}
                    isDeleting={deleteBudgetMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                No budgets yet. Create your first budget to start tracking spending.
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-semibold text-2xl">Financial Goals</h2>
              <Button
                onClick={() => setShowGoalDialog(true)}
                className="gap-2"
                data-testid="button-create-goal"
              >
                <Plus className="h-4 w-4" />
                Create Goal
              </Button>
            </div>
            {loadingGoals ? (
              <div className="text-muted-foreground">Loading goals...</div>
            ) : activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    id={goal.id}
                    name={goal.name}
                    current={parseFloat(goal.currentAmount)}
                    target={parseFloat(goal.targetAmount)}
                    deadline={goal.deadline ? new Date(goal.deadline) : undefined}
                    type={goal.type as any}
                    onDelete={() => deleteGoalMutation.mutate(goal.id)}
                    isDeleting={deleteGoalMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                No goals yet. Create your first goal to start tracking progress.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent data-testid="dialog-create-budget">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription>Set a spending limit for a category</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="budget-category">Category</Label>
                <Select name="category" defaultValue="Food & Dining">
                  <SelectTrigger data-testid="select-budget-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Groceries">Groceries</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget-amount">Budget Amount</Label>
                <Input
                  id="budget-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  data-testid="input-budget-amount"
                />
              </div>
              <div>
                <Label htmlFor="budget-period">Period</Label>
                <Select name="period" defaultValue="monthly">
                  <SelectTrigger data-testid="select-budget-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createBudgetMutation.isPending} data-testid="button-submit-budget">
                {createBudgetMutation.isPending ? 'Creating...' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent data-testid="dialog-create-goal">
          <DialogHeader>
            <DialogTitle>Create Financial Goal</DialogTitle>
            <DialogDescription>Set a target to save towards</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGoal}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  name="name"
                  required
                  placeholder="Emergency Fund"
                  data-testid="input-goal-name"
                />
              </div>
              <div>
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select name="type" defaultValue="emergency_fund">
                  <SelectTrigger data-testid="select-goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-target">Target Amount</Label>
                <Input
                  id="goal-target"
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="10000.00"
                  data-testid="input-goal-target"
                />
              </div>
              <div>
                <Label htmlFor="goal-deadline">Deadline (Optional)</Label>
                <Input
                  id="goal-deadline"
                  name="deadline"
                  type="date"
                  data-testid="input-goal-deadline"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createGoalMutation.isPending} data-testid="button-submit-goal">
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deleted Budgets History */}
      {deletedBudgetMetrics.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="font-serif font-semibold text-2xl mb-6">Budget History (Deleted)</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="space-y-4">
                {deletedBudgetMetrics.map((budget) => (
                  <Card key={budget.id} className="opacity-60">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{budget.category}</span>
                        <span className="text-xs text-muted-foreground capitalize">{budget.period}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Spent</p>
                          <p className="font-mono font-semibold">₹{budget.spent.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Limit</p>
                          <p className="font-mono font-semibold">₹{budget.limit.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">(Deleted)</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Goals History */}
      {deletedGoals.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="font-serif font-semibold text-2xl mb-6">Goal History (Deleted)</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="space-y-4">
                {deletedGoals.map((goal) => (
                  <Card key={goal.id} className="opacity-60">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{goal.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Saved</p>
                          <p className="font-mono font-semibold">₹{parseFloat(goal.currentAmount).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Target</p>
                          <p className="font-mono font-semibold">₹{parseFloat(goal.targetAmount).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">(Deleted)</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
