import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

interface BudgetCardProps {
  id?: string;
  category: string;
  spent: number;
  limit: number;
  period: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function BudgetCard({ id, category, spent, limit, period, onDelete, isDeleting }: BudgetCardProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [localSpent, setLocalSpent] = useState(spent);
  const { toast } = useToast();

  const percentage = (localSpent / limit) * 100;
  const isOverBudget = localSpent > limit;
  const remaining = limit - localSpent;

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid expense amount",
        variant: "destructive",
      });
      return;
    }

    setLocalSpent(prev => prev + amount);
    setExpenseAmount("");
    setShowAddExpense(false);
    toast({
      title: "Expense added",
      description: `${category} expense of ₹${amount.toFixed(2)} added successfully`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{category}</span>
            <span className="text-xs font-normal text-muted-foreground capitalize">{period}</span>
          </CardTitle>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              data-testid={`button-delete-budget-${id}`}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={Math.min(percentage, 100)}
          className="h-3"
        />
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Spent</p>
            <p className="font-mono font-semibold">₹{localSpent.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Limit</p>
            <p className="font-mono font-semibold">₹{limit.toFixed(2)}</p>
          </div>
        </div>
        {isOverBudget ? (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Over budget by ₹{Math.abs(remaining).toFixed(2)}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            ₹{remaining.toFixed(2)} remaining
          </p>
        )}

        {showAddExpense ? (
          <div className="flex gap-2 mt-3">
            <Input
              type="number"
              placeholder="Enter expense amount (USD)"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddExpense}
              className="bg-accent hover:bg-accent/90"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddExpense(false);
                setExpenseAmount("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 mt-2"
            onClick={() => setShowAddExpense(true)}
          >
            <Plus className="h-3 w-3" />
            Add Expense
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
