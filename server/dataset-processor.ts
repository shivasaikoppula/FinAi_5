// Efficient dataset processing for large fraud detection datasets
import { parse } from "csv-parse/sync";
import type { Transaction } from "@shared/schema";

export interface DatasetStats {
  totalTransactions: number;
  fraudCount: number;
  fraudPercentage: number;
  fraudPatterns: FraudPatternSummary[];
  topMerchants: { name: string; count: number; fraudCount: number }[];
  amountStats: { min: number; max: number; average: number; median: number };
  categoryDistribution: Record<string, number>;
}

export interface FraudPatternSummary {
  pattern: string;
  frequency: number;
  associatedFraudRate: number; // percentage of times this pattern appears in fraud
}

export async function processIEEEDataset(csvContent: string): Promise<DatasetStats> {
  try {
    // Parse CSV - handle large files efficiently
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, any>>;

    let totalTransactions = 0;
    let fraudCount = 0;
    const merchantData: Record<string, { count: number; fraudCount: number }> = {};
    const amounts: number[] = [];
    const patterns: Record<string, { count: number; fraudCount: number }> = {};
    const categories: Record<string, number> = {};

    // Process records - limit to 50k for performance
    const recordsToProcess = records.slice(0, 50000);

    // Process records
    for (const record of recordsToProcess) {
      totalTransactions++;

      // Map IEEE-CIS dataset columns to our schema
      const amount = parseFloat((record as any).TransactionAmt || (record as any).Amount || "0");
      const isFraud = (record as any).isFraud === "1" || (record as any).isFraud === 1;
      const merchant = (record as any).Merchant || `Merchant_${(record as any).MerchantID || "Unknown"}`;

      if (isFraud) fraudCount++;
      amounts.push(amount);

      // Track merchants
      if (!merchantData[merchant]) {
        merchantData[merchant] = { count: 0, fraudCount: 0 };
      }
      merchantData[merchant].count++;
      if (isFraud) merchantData[merchant].fraudCount++;

      // Extract patterns
      const patterns_list = extractPatterns(record as any, isFraud);
      patterns_list.forEach(pattern => {
        if (!patterns[pattern]) {
          patterns[pattern] = { count: 0, fraudCount: 0 };
        }
        patterns[pattern].count++;
        if (isFraud) patterns[pattern].fraudCount++;
      });

      // Category (estimate from merchant or transaction type)
      const category = estimateCategory(record as any);
      categories[category] = (categories[category] || 0) + 1;
    }

    // Calculate statistics
    amounts.sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Build fraud patterns with association rates
    const fraudPatterns: FraudPatternSummary[] = Object.entries(patterns)
      .filter(([, data]) => data.fraudCount > 0)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        associatedFraudRate: (data.fraudCount / data.count) * 100,
      }))
      .sort((a, b) => b.associatedFraudRate - a.associatedFraudRate)
      .slice(0, 10); // Top 10 patterns

    // Top merchants by fraud
    const topMerchants = Object.entries(merchantData)
      .filter(([, data]) => data.fraudCount > 0)
      .map(([name, data]) => ({ name, count: data.count, fraudCount: data.fraudCount }))
      .sort((a, b) => b.fraudCount - a.fraudCount)
      .slice(0, 10);

    return {
      totalTransactions,
      fraudCount,
      fraudPercentage: (fraudCount / totalTransactions) * 100,
      fraudPatterns,
      topMerchants,
      amountStats: {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        average: parseFloat(average.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
      },
      categoryDistribution: categories,
    };
  } catch (error) {
    console.error("Dataset processing error:", error);
    throw new Error(`Failed to process dataset: ${error}`);
  }
}

function extractPatterns(record: any, isFraud: boolean): string[] {
  const patterns: string[] = [];

  // Payment type pattern
  if (record.PaymentType || record.ProductCD) {
    const paymentType = record.PaymentType || record.ProductCD;
    patterns.push(`payment_type_${paymentType}`);
  }

  // Device pattern
  if (record.DeviceType) {
    patterns.push(`device_${record.DeviceType}`);
  }

  // Amount range pattern
  const amount = parseFloat(record.TransactionAmt || record.Amount || "0");
  if (amount > 100000) patterns.push("high_amount_100k+");
  else if (amount > 50000) patterns.push("high_amount_50k");
  else if (amount > 10000) patterns.push("medium_amount_10k");
  else if (amount < 100) patterns.push("low_amount_under_100");

  // Time pattern (if available)
  if (record.TransactionTime) {
    const hour = new Date(record.TransactionTime).getHours();
    if (hour >= 0 && hour < 6) patterns.push("time_early_morning");
    else if (hour >= 18 && hour < 24) patterns.push("time_evening");
  }

  // Browser/OS pattern (if available)
  if (record.Browser) {
    patterns.push(`browser_${record.Browser}`);
  }

  // Country pattern (if available)
  if (record.Country) {
    patterns.push(`country_${record.Country}`);
  }

  return patterns;
}

function estimateCategory(record: any): string {
  const merchant = (record.Merchant || record.MerchantID || "").toLowerCase();
  const productCD = (record.ProductCD || "").toLowerCase();

  // Map to categories
  if (merchant.includes("gas") || merchant.includes("fuel")) return "Fuel";
  if (merchant.includes("grocery") || merchant.includes("supermarket")) return "Groceries";
  if (merchant.includes("restaurant") || merchant.includes("cafe")) return "Food & Dining";
  if (merchant.includes("hotel") || merchant.includes("travel")) return "Travel";
  if (merchant.includes("shopping") || merchant.includes("retail")) return "Shopping";
  if (merchant.includes("health") || merchant.includes("pharmacy")) return "Healthcare";
  if (merchant.includes("entertainment") || merchant.includes("movie")) return "Entertainment";

  // Fallback to ProductCD
  if (productCD === "s") return "Shopping";
  if (productCD === "w") return "Withdrawal";
  if (productCD === "c") return "Cash";

  return "Other";
}
