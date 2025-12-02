// LLM-powered fraud analysis for transaction datasets
import { type Transaction } from "@shared/schema";
import { getPretrainedPatterns } from "./dataset-initialization";

export interface FraudPattern {
  pattern: string;
  frequency: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  affectedTransactions: number;
}

export interface DebitCreditAnalysis {
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  largestDebit: { amount: number; merchant: string };
  largestCredit: { amount: number; merchant: string };
  debitCategories: Record<string, number>;
  creditCategories: Record<string, number>;
}

export interface LLMFraudAnalysisResult {
  summary: string;
  fraudPatterns: FraudPattern[];
  debitCreditAnalysis: DebitCreditAnalysis;
  riskAssessment: string;
  recommendations: string[];
  overallFraudRisk: number; // 0-100
}

export async function analyzeFraudWithLLM(
  transactions: Transaction[],
  apiKey?: string
): Promise<LLMFraudAnalysisResult> {
  // Calculate debit/credit analysis first
  const debitCreditAnalysis = calculateDebitCreditAnalysis(transactions);
  
  // If no API key, provide rule-based analysis
  if (!apiKey) {
    return provideRuleBasedAnalysis(transactions, debitCreditAnalysis);
  }

  try {
    // Call Gemini for LLM-powered analysis
    return await callGeminiForFraudAnalysis(transactions, debitCreditAnalysis, apiKey);
  } catch (error) {
    console.error("LLM fraud analysis error:", error);
    // Fallback to rule-based analysis
    return provideRuleBasedAnalysis(transactions, debitCreditAnalysis);
  }
}

function calculateDebitCreditAnalysis(transactions: Transaction[]): DebitCreditAnalysis {
  const debits: { amount: number; merchant: string; category: string }[] = [];
  const credits: { amount: number; merchant: string; category: string }[] = [];

  transactions.forEach(t => {
    const amount = Math.abs(parseFloat(t.amount as string));
    if (t.type === 'expense') {
      debits.push({ amount, merchant: t.merchant, category: t.category });
    } else if (t.type === 'income') {
      credits.push({ amount, merchant: t.merchant, category: t.category });
    }
  });

  const debitCategories: Record<string, number> = {};
  const creditCategories: Record<string, number> = {};

  debits.forEach(d => {
    debitCategories[d.category] = (debitCategories[d.category] || 0) + d.amount;
  });

  credits.forEach(c => {
    creditCategories[c.category] = (creditCategories[c.category] || 0) + c.amount;
  });

  const totalDebits = debits.reduce((sum, d) => sum + d.amount, 0);
  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

  return {
    totalDebits: parseFloat(totalDebits.toFixed(2)),
    totalCredits: parseFloat(totalCredits.toFixed(2)),
    debitCount: debits.length,
    creditCount: credits.length,
    largestDebit: debits.length > 0 
      ? debits.reduce((max, d) => d.amount > max.amount ? d : max)
      : { amount: 0, merchant: "N/A" },
    largestCredit: credits.length > 0
      ? credits.reduce((max, c) => c.amount > max.amount ? c : max)
      : { amount: 0, merchant: "N/A" },
    debitCategories,
    creditCategories,
  };
}

function detectFraudPatterns(transactions: Transaction[]): FraudPattern[] {
  const patterns: FraudPattern[] = [];
  const pretrainedPatterns = getPretrainedPatterns();

  // Include pretrained patterns from IEEE dataset
  if (pretrainedPatterns && pretrainedPatterns.patterns.length > 0) {
    pretrainedPatterns.patterns.slice(0, 5).forEach(pretrained => {
      const riskLevel: "low" | "medium" | "high" | "critical" = 
        pretrained.fraudRiskScore > 70 ? "critical" :
        pretrained.fraudRiskScore > 50 ? "high" :
        pretrained.fraudRiskScore > 30 ? "medium" : "low";
      
      patterns.push({
        pattern: `[Dataset Pattern] ${pretrained.description}`,
        frequency: pretrained.frequency,
        riskLevel,
        affectedTransactions: Math.round(pretrained.frequency * (pretrained.fraudRiskScore / 100)),
      });
    });

    // High-risk merchants from dataset
    if (pretrainedPatterns.highRiskMerchants.length > 0) {
      const matchingTxns = transactions.filter(t =>
        pretrainedPatterns.highRiskMerchants.some(m => t.merchant.toLowerCase().includes(m.toLowerCase()))
      );
      if (matchingTxns.length > 0) {
        patterns.push({
          pattern: `Transactions from high-risk merchants (IEEE data)`,
          frequency: matchingTxns.length,
          riskLevel: "high",
          affectedTransactions: matchingTxns.length,
        });
      }
    }
  }

  // Pattern 1: Unusual velocity
  const last24h = transactions.filter(t => {
    const hoursDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });
  
  if (last24h.length > 15) {
    patterns.push({
      pattern: "High transaction velocity (15+ transactions in 24 hours)",
      frequency: last24h.length,
      riskLevel: "high",
      affectedTransactions: last24h.length,
    });
  }

  // Pattern 2: Large transactions
  const largeTxns = transactions.filter(t => {
    const amount = parseFloat(t.amount as string);
    return Math.abs(amount) > 50000;
  });

  if (largeTxns.length > 0) {
    patterns.push({
      pattern: `Large transactions detected (₹50,000+): ${largeTxns.length} transactions`,
      frequency: largeTxns.length,
      riskLevel: largeTxns.length > 3 ? "high" : "medium",
      affectedTransactions: largeTxns.length,
    });
  }

  // Pattern 3: Duplicate-like transactions
  const merchantGroups: Record<string, Transaction[]> = {};
  transactions.forEach(t => {
    const key = `${t.merchant}_${Math.round(parseFloat(t.amount as string) / 100) * 100}`;
    merchantGroups[key] = [...(merchantGroups[key] || []), t];
  });

  Object.entries(merchantGroups).forEach(([key, group]) => {
    if (group.length > 2) {
      patterns.push({
        pattern: `Repeated similar transactions: ${group[0].merchant}`,
        frequency: group.length,
        riskLevel: group.length > 5 ? "high" : "medium",
        affectedTransactions: group.length,
      });
    }
  });

  // Pattern 4: Unusual merchants
  const fraudTxns = transactions.filter(t => t.isFraudulent);
  if (fraudTxns.length > 0) {
    patterns.push({
      pattern: `Flagged transactions detected by fraud detector`,
      frequency: fraudTxns.length,
      riskLevel: "critical",
      affectedTransactions: fraudTxns.length,
    });
  }

  return patterns;
}

async function callGeminiForFraudAnalysis(
  transactions: Transaction[],
  debitCreditAnalysis: DebitCreditAnalysis,
  apiKey: string
): Promise<LLMFraudAnalysisResult> {
  // Prepare transaction summary for LLM
  const txnSummary = transactions.slice(0, 50).map(t => ({
    merchant: t.merchant,
    amount: parseFloat(t.amount as string),
    category: t.category,
    type: t.type,
    date: new Date(t.date).toLocaleDateString(),
    isFraudulent: t.isFraudulent,
  }));

  const prompt = `Analyze this financial transaction dataset for fraud patterns and provide insights:

TRANSACTION SUMMARY (showing first 50 of ${transactions.length}):
${JSON.stringify(txnSummary, null, 2)}

DEBIT/CREDIT ANALYSIS:
- Total Debits: ₹${debitCreditAnalysis.totalDebits.toFixed(2)} (${debitCreditAnalysis.debitCount} transactions)
- Total Credits: ₹${debitCreditAnalysis.totalCredits.toFixed(2)} (${debitCreditAnalysis.creditCount} transactions)
- Largest Debit: ₹${debitCreditAnalysis.largestDebit.amount.toFixed(2)} (${debitCreditAnalysis.largestDebit.merchant})
- Largest Credit: ₹${debitCreditAnalysis.largestCredit.amount.toFixed(2)} (${debitCreditAnalysis.largestCredit.merchant})

Please provide:
1. Summary of fraud risk assessment
2. Top 5 fraud patterns identified
3. Risk level for each pattern (low/medium/high/critical)
4. Overall fraud risk score (0-100)
5. Specific recommendations to prevent fraud

Format your response as JSON with this structure:
{
  "summary": "brief overview",
  "patterns": [
    {"pattern": "description", "riskLevel": "high", "frequency": 5}
  ],
  "riskScore": 45,
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API error");
    const data = await response.json();
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const patterns: FraudPattern[] = (parsed.patterns || []).map((p: any) => ({
      pattern: p.pattern,
      frequency: p.frequency || 1,
      riskLevel: p.riskLevel || "medium",
      affectedTransactions: p.frequency || 1,
    }));

    return {
      summary: parsed.summary || "Fraud analysis completed",
      fraudPatterns: patterns,
      debitCreditAnalysis,
      riskAssessment: parsed.riskAssessment || "Analysis in progress",
      recommendations: parsed.recommendations || [],
      overallFraudRisk: parsed.riskScore || 0,
    };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    // Fallback to rule-based
    throw error;
  }
}

function provideRuleBasedAnalysis(
  transactions: Transaction[],
  debitCreditAnalysis: DebitCreditAnalysis
): LLMFraudAnalysisResult {
  const patterns = detectFraudPatterns(transactions);
  
  const fraudTxns = transactions.filter(t => t.isFraudulent).length;
  
  // Calculate weighted fraud risk based on pattern severity
  const riskWeights = {
    critical: 100,
    high: 70,
    medium: 50,
    low: 20,
  };
  
  let patternRiskScore = 0;
  if (patterns.length > 0) {
    const totalWeight = patterns.reduce((sum, p) => sum + riskWeights[p.riskLevel], 0);
    patternRiskScore = totalWeight / patterns.length; // Average risk from patterns
  }
  
  // Calculate debit/credit imbalance risk
  const totalAmount = debitCreditAnalysis.totalDebits + debitCreditAnalysis.totalCredits;
  const debitCreditRatio = totalAmount > 0 
    ? (Math.abs(debitCreditAnalysis.totalDebits - debitCreditAnalysis.totalCredits) / totalAmount) * 100
    : 0;
  
  // Flagged transaction percentage
  const flaggedPercentage = transactions.length > 0 
    ? (fraudTxns / transactions.length) * 100
    : 0;
  
  // Combine all risk factors
  // 40% from pattern severity, 35% from flagged transactions, 25% from debit/credit imbalance
  const overallRisk = Math.min(100, 
    (patternRiskScore * 0.4) + 
    (flaggedPercentage * 0.35) + 
    (Math.min(debitCreditRatio, 100) * 0.25)
  );

  return {
    summary: `Analyzed ${transactions.length} transactions. Detected ${fraudTxns} flagged transactions and ${patterns.length} fraud patterns.`,
    fraudPatterns: patterns,
    debitCreditAnalysis,
    riskAssessment: `Your account has a ${overallRisk.toFixed(1)}% fraud risk score. ${
      overallRisk >= 70 ? 'Multiple critical issues detected. Immediate review recommended.' :
      overallRisk >= 50 ? 'Several suspicious patterns identified. Enhanced monitoring advised.' :
      'No critical issues found.'
    }`,
    recommendations: [
      "Monitor unusual merchant patterns regularly",
      "Enable transaction alerts for high-value transactions",
      "Review and verify one-time merchants",
      fraudTxns > 0 ? "Contact bank if suspicious transactions found" : "Maintain current security practices",
      "Keep transaction records for audit purposes",
      overallRisk >= 70 ? "Consider updating account security and payment methods" : "",
    ].filter(Boolean),
    overallFraudRisk: parseFloat(overallRisk.toFixed(1)),
  };
}
