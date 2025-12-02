import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HealthScoreCardProps {
  score: number;
  change?: number;
  components?: {
    incomeStability: number;
    expenseRatio: number;
    savingsRate: number;
    debtRatio: number;
    liquidity: number;
  };
}

export default function HealthScoreCard({ score, change, components }: HealthScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-chart-3";
    return "text-destructive";
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-accent";
    if (value >= 60) return "bg-primary";
    return "bg-chart-3";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-4xl font-bold font-mono ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-muted-foreground text-sm">/100</span>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ml-auto ${change >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {components && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Income Stability</span>
                <span className="font-medium">{components.incomeStability}%</span>
              </div>
              <Progress value={components.incomeStability} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Expense Ratio</span>
                <span className="font-medium">{components.expenseRatio}%</span>
              </div>
              <Progress value={components.expenseRatio} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Savings Rate</span>
                <span className="font-medium">{components.savingsRate}%</span>
              </div>
              <Progress value={components.savingsRate} className="h-2" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
