import { type Transaction } from "@shared/schema";

export interface FraudCheckResult {
  isFraudulent: boolean;
  reason?: string;
  riskScore: number; // 0-100
}

// Rule-based fraud detection
export async function detectFraud(
  transaction: Omit<Transaction, "id" | "createdAt">,
  recentTransactions: Transaction[]
): Promise<FraudCheckResult> {
  const amount = parseFloat(transaction.amount as string);
  const risks: { reason: string; score: number }[] = [];

  // Rule 1: Large transaction amount (>₹50,000)
  if (amount > 50000) {
    risks.push({
      reason: "Unusually large transaction amount",
      score: 55,
    });
  }

  // Rule 2: Very large transaction (>₹100,000)
  if (amount > 100000) {
    risks.push({
      reason: "Extremely large transaction amount",
      score: 85,
    });
  }

  // Rule 3: Multiple transactions in short time (velocity check)
  const last24Hours = recentTransactions.filter((t) => {
    const hoursDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  if (last24Hours.length >= 20) {
    risks.push({
      reason: "High transaction velocity (20+ transactions in 24 hours)",
      score: 70,
    });
  }

  // Rule 4: Rapid consecutive transactions
  const last5Minutes = recentTransactions.filter((t) => {
    const minutesDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60);
    return minutesDiff <= 5;
  });

  if (last5Minutes.length >= 10) {
    risks.push({
      reason: "Multiple rapid transactions (10+ in 5 minutes)",
      score: 80,
    });
  }

  // Rule 5: Unusual merchant for typical spending patterns
  const merchantFrequency = recentTransactions.filter(
    (t) => t.merchant.toLowerCase() === transaction.merchant.toLowerCase()
  );

  if (merchantFrequency.length === 0 && amount > 10000) {
    risks.push({
      reason: "First-time merchant with large amount",
      score: 40,
    });
  }

  // Rule 6: Duplicate transaction detection (same merchant, same amount within 1 hour)
  const duplicates = recentTransactions.filter((t) => {
    const hoursDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60);
    return (
      hoursDiff <= 1 &&
      t.merchant.toLowerCase() === transaction.merchant.toLowerCase() &&
      Math.abs(parseFloat(t.amount as string) - amount) < 0.01
    );
  });

  if (duplicates.length > 0) {
    risks.push({
      reason: "Potential duplicate transaction",
      score: 90,
    });
  }

  // Calculate overall risk score
  const maxRiskScore = risks.length > 0 ? Math.max(...risks.map((r) => r.score)) : 0;
  const isFraudulent = maxRiskScore >= 85;

  return {
    isFraudulent,
    reason: isFraudulent ? risks.find((r) => r.score === maxRiskScore)?.reason : undefined,
    riskScore: maxRiskScore,
  };
}

// Categorize transactions using rule-based logic
export function categorizeTransaction(merchant: string, amount: number): string {
  const merchantLower = merchant.toLowerCase();

  // Food & Dining
  if (
    merchantLower.includes("restaurant") ||
    merchantLower.includes("cafe") ||
    merchantLower.includes("coffee") ||
    merchantLower.includes("pizza") ||
    merchantLower.includes("burger") ||
    merchantLower.includes("food") ||
    merchantLower.includes("grubhub") ||
    merchantLower.includes("doordash") ||
    merchantLower.includes("ubereats")
  ) {
    return "Food & Dining";
  }

  // Groceries
  if (
    merchantLower.includes("grocery") ||
    merchantLower.includes("supermarket") ||
    merchantLower.includes("walmart") ||
    merchantLower.includes("target") ||
    merchantLower.includes("whole foods") ||
    merchantLower.includes("trader joe")
  ) {
    return "Groceries";
  }

  // Transportation
  if (
    merchantLower.includes("uber") ||
    merchantLower.includes("lyft") ||
    merchantLower.includes("taxi") ||
    merchantLower.includes("gas") ||
    merchantLower.includes("fuel") ||
    merchantLower.includes("parking")
  ) {
    return "Transportation";
  }

  // Shopping
  if (
    merchantLower.includes("amazon") ||
    merchantLower.includes("ebay") ||
    merchantLower.includes("mall") ||
    merchantLower.includes("store")
  ) {
    return "Shopping";
  }

  // Entertainment
  if (
    merchantLower.includes("netflix") ||
    merchantLower.includes("spotify") ||
    merchantLower.includes("hulu") ||
    merchantLower.includes("cinema") ||
    merchantLower.includes("theater") ||
    merchantLower.includes("movie")
  ) {
    return "Entertainment";
  }

  // Utilities
  if (
    merchantLower.includes("electric") ||
    merchantLower.includes("water") ||
    merchantLower.includes("internet") ||
    merchantLower.includes("phone") ||
    merchantLower.includes("verizon") ||
    merchantLower.includes("at&t")
  ) {
    return "Utilities";
  }

  // Healthcare
  if (
    merchantLower.includes("pharmacy") ||
    merchantLower.includes("hospital") ||
    merchantLower.includes("doctor") ||
    merchantLower.includes("medical") ||
    merchantLower.includes("cvs") ||
    merchantLower.includes("walgreens")
  ) {
    return "Healthcare";
  }

  // Travel
  if (
    merchantLower.includes("airline") ||
    merchantLower.includes("hotel") ||
    merchantLower.includes("airbnb") ||
    merchantLower.includes("booking")
  ) {
    return "Travel";
  }

  return "Other";
}
