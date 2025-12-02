import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Plane, Home as HomeIcon, TrendingUp, CreditCard, Plus, Trash2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { formatINR } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

interface GoalCardProps {
  id?: string;
  name: string;
  current: number;
  target: number;
  deadline?: Date;
  type: "emergency_fund" | "vacation" | "investment" | "debt_payoff";
  onDelete?: () => void;
  isDeleting?: boolean;
}

const goalIcons = {
  emergency_fund: Target,
  vacation: Plane,
  investment: TrendingUp,
  debt_payoff: CreditCard,
};

export default function GoalCard({ id, name, current, target, deadline, type, onDelete, isDeleting }: GoalCardProps) {
  const [showAddAmount, setShowAddAmount] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [localCurrent, setLocalCurrent] = useState(current);
  const { toast } = useToast();

  const percentage = (localCurrent / target) * 100;
  const Icon = goalIcons[type] || Target;
  const remaining = target - localCurrent;
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null;

  const handleAddAmount = () => {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLocalCurrent(prev => Math.min(prev + amount, target));
    setAmountInput("");
    setShowAddAmount(false);
    toast({
      title: "Progress updated",
      description: `Added ₹${amount.toFixed(2)} towards ${name}`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <span>{name}</span>
          </CardTitle>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              data-testid={`button-delete-goal-${id}`}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={Math.min(percentage, 100)} className="h-3" />
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-mono font-semibold text-accent">₹{localCurrent.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Target</p>
            <p className="font-mono font-semibold">₹{target.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {percentage >= 100 ? 'Goal achieved!' : `₹${remaining.toFixed(2)} to go`}
          </span>
          {daysLeft !== null && daysLeft > 0 && deadline && (
            <span className="text-muted-foreground">
              {daysLeft} days until {format(deadline, "MMM d")}
            </span>
          )}
        </div>

        {showAddAmount ? (
          <div className="flex gap-2 mt-3">
            <Input
              type="number"
              placeholder="Enter amount (USD)"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddAmount}
              className="bg-primary hover:bg-primary/90"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddAmount(false);
                setAmountInput("");
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
            onClick={() => setShowAddAmount(true)}
            disabled={percentage >= 100}
          >
            <Plus className="h-3 w-3" />
            Add Savings
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
