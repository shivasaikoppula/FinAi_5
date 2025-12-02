import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import type { DatasetStats } from "@shared/schema";

interface DatasetStatsDisplayProps {
  stats: DatasetStats;
}

export default function DatasetStatsDisplay({ stats }: DatasetStatsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Fraudulent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.fraudCount}</div>
            <p className="text-xs text-muted-foreground">{stats.fraudPercentage.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.amountStats.average.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Max Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.amountStats.max.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Fraud Patterns */}
      {stats.fraudPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Fraud Patterns from Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.fraudPatterns.map((pattern, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{pattern.pattern}</p>
                    <p className="text-xs text-muted-foreground">Appears in {pattern.frequency} transactions</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">
                    {pattern.associatedFraudRate.toFixed(1)}% fraud rate
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Merchants with Fraud */}
      {stats.topMerchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Merchants with Most Fraud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topMerchants.map((merchant, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>{merchant.name}</span>
                  <span className="text-xs text-destructive font-semibold">
                    {merchant.fraudCount} frauds / {merchant.count} trans
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Distribution */}
      {Object.keys(stats.categoryDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                <div key={category} className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">{category}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
