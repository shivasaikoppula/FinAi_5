import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, TrendingUp, Shield, Receipt, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { LLMFraudAnalysisResult } from "@shared/schema";

interface FraudAnalysisDisplayProps {
  analysis: LLMFraudAnalysisResult;
}

export default function FraudAnalysisDisplay({ analysis }: FraudAnalysisDisplayProps) {
  const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  const overallRisk = analysis.overallFraudRisk ?? 0;
  const debitCreditAnalysis = analysis.debitCreditAnalysis ?? {
    totalDebits: 0,
    totalCredits: 0,
    debitCount: 0,
    creditCount: 0,
    largestDebit: { amount: 0, merchant: "N/A" },
    largestCredit: { amount: 0, merchant: "N/A" },
    debitCategories: {},
    creditCategories: {},
  };

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Fraud Risk</CardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{overallRisk.toFixed(1)}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <Progress value={overallRisk} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {overallRisk >= 70 ? "High risk detected" 
                 : overallRisk >= 40 ? "Moderate risk"
                 : "Low risk"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Patterns Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">{analysis.fraudPatterns?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {analysis.fraudPatterns?.filter(p => p.riskLevel === 'critical').length ?? 0} critical patterns
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debit/Credit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debit & Credit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Total Debits</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{(debitCreditAnalysis.totalDebits ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {debitCreditAnalysis.debitCount ?? 0} transactions
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(debitCreditAnalysis.totalCredits ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {debitCreditAnalysis.creditCount ?? 0} transactions
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Largest Debit
              </p>
              <p className="text-lg font-bold">
                ₹{(debitCreditAnalysis.largestDebit?.amount ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {debitCreditAnalysis.largestDebit?.merchant ?? "N/A"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Largest Credit
              </p>
              <p className="text-lg font-bold">
                ₹{(debitCreditAnalysis.largestCredit?.amount ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {debitCreditAnalysis.largestCredit?.merchant ?? "N/A"}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-sm font-semibold mb-3">Debit Categories</p>
              <div className="space-y-2">
                {Object.entries(debitCreditAnalysis.debitCategories ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-mono">₹{(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Credit Categories</p>
              <div className="space-y-2">
                {Object.entries(debitCreditAnalysis.creditCategories ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-mono">₹{(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.riskAssessment}</p>
        </CardContent>
      </Card>

      {/* Fraud Patterns */}
      {(analysis.fraudPatterns?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detected Fraud Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analysis.fraudPatterns ?? []).map((pattern, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{pattern.pattern}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold
                      ${pattern.riskLevel === 'critical' ? 'bg-destructive text-destructive-foreground' :
                        pattern.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        pattern.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                    >
                      {pattern.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Frequency: {pattern.frequency}</span>
                    <span>Transactions: {pattern.affectedTransactions}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {(analysis.recommendations?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(analysis.recommendations ?? []).map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-accent font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tax Optimization Hints */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">Tax Optimization Hints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on your transaction patterns, here are some tax-saving opportunities:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Keep Receipt Records</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Healthcare, education, and transportation expenses can be tax-deductible. 
                  Maintain digital copies of all receipts for deduction claims.
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Track Deductible Categories</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Up to 50% of healthcare, 75% of education, and 40% of transportation 
                  expenses may qualify for tax deductions under various sections.
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm">
                <strong className="text-accent">Tip:</strong> Regular scanning of receipts helps build a 
                comprehensive record for tax filing. Flag large transactions for audit trail purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
