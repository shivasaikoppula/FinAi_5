// Automatic IEEE Fraud Detection Dataset Initialization
import { readFileSync, existsSync } from "fs";
import { parse as parseCSV } from "csv-parse/sync";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

export interface PretrainedFraudPattern {
  pattern: string;
  frequency: number;
  fraudRiskScore: number;
  description: string;
}

export interface DatasetPatterns {
  patterns: PretrainedFraudPattern[];
  totalTransactionsAnalyzed: number;
  fraudPercentage: number;
  lastUpdated: Date;
  highRiskMerchants: string[];
  commonFraudIndicators: string[];
}

let cachedPatterns: DatasetPatterns | null = null;

export function getPretrainedPatterns(): DatasetPatterns | null {
  return cachedPatterns;
}

export function setPretrainedPatterns(patterns: DatasetPatterns): void {
  cachedPatterns = patterns;
}

export async function initializeDatasetPatterns(): Promise<DatasetPatterns | null> {
  try {
    // Look for any ZIP file in attached_assets directory
    const assetsDir = "/home/runner/project/attached_assets";
    let datasetPath: string | null = null;
    
    // Find first ZIP file in attached_assets
    if (existsSync(assetsDir)) {
      const files = require("fs").readdirSync(assetsDir);
      const zipFile = files.find((f: string) => f.endsWith(".zip"));
      if (zipFile) {
        datasetPath = require("path").join(assetsDir, zipFile);
      }
    }
    
    if (!datasetPath || !existsSync(datasetPath)) {
      console.log("📊 Dataset ZIP file not found - starting without pretrained fraud patterns");
      console.log("💡 Tip: Upload a fraud detection dataset ZIP file to enable LLM training");
      return null;
    }

    console.log("Loading IEEE Fraud Detection dataset...");
    
    try {
      // Try to extract ZIP using system tar/unzip command
      const tempDir = tmpdir();
      execSync(`cd ${tempDir} && unzip -q ${datasetPath} -d ieee_extract_${Date.now()}`, { stdio: "ignore" });
    } catch {
      // If unzip fails, try direct read
    }

    let csvContent: string | null = null;
    
    // Try to read ZIP file as buffer and extract CSV
    try {
      const zipBuffer = readFileSync(datasetPath);
      // Simple approach: look for CSV content pattern
      const bufferStr = zipBuffer.toString("latin1");
      const csvMatch = bufferStr.match(/(?:isFraud|TransactionAmt)[\s\S]*?(?=\n[^\n]*\n[^\n]*\n|$)/);
      if (csvMatch) {
        // Find the actual CSV data
        const lines = bufferStr.split("\n");
        const headerIdx = lines.findIndex(l => l.includes("isFraud") || l.includes("TransactionAmt"));
        if (headerIdx >= 0) {
          csvContent = lines.slice(headerIdx, headerIdx + 50001).join("\n");
        }
      }
    } catch {
      // Silent fail
    }

    if (!csvContent) {
      console.log("Could not extract CSV from dataset");
      return null;
    }

    const patterns = processDataset(csvContent);
    cachedPatterns = patterns;
    console.log(`✓ Loaded ${patterns.patterns.length} fraud patterns from dataset`);
    return patterns;
  } catch (error) {
    console.warn("Dataset initialization skipped:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

function processDataset(csvContent: string): DatasetPatterns {
  try {
    const records = parseCSV(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, any>>;

    const recordsToProcess = records.slice(0, 50000);
    
    let totalFraud = 0;
    const patternFrequency: Record<string, { count: number; fraudCount: number }> = {};
    const merchantFraudMap: Record<string, number> = {};
    const highRiskMerchants = new Set<string>();

    for (const record of recordsToProcess) {
      const isFraud = record.isFraud === "1" || record.isFraud === 1;
      if (isFraud) totalFraud++;

      const merchant = record.Merchant || `Merchant_${record.MerchantID || "Unknown"}`;
      merchantFraudMap[merchant] = (merchantFraudMap[merchant] || 0) + (isFraud ? 1 : 0);

      const patterns = extractPatterns(record, isFraud);
      patterns.forEach((pattern: string) => {
        if (!patternFrequency[pattern]) {
          patternFrequency[pattern] = { count: 0, fraudCount: 0 };
        }
        patternFrequency[pattern].count++;
        if (isFraud) patternFrequency[pattern].fraudCount++;
      });
    }

    Object.entries(merchantFraudMap).forEach(([merchant, fraudCount]) => {
      const totalForMerchant = recordsToProcess.filter(
        (r: any) => (r.Merchant || `Merchant_${r.MerchantID}`) === merchant
      ).length;
      if (fraudCount / totalForMerchant > 0.05) {
        highRiskMerchants.add(merchant);
      }
    });

    const patterns: PretrainedFraudPattern[] = Object.entries(patternFrequency)
      .filter(([, data]) => data.fraudCount > 0)
      .map(([pattern, data]) => {
        const fraudRatePercent = (data.fraudCount / data.count) * 100;
        return {
          pattern,
          frequency: data.count,
          fraudRiskScore: Math.min(100, Math.round(fraudRatePercent * 2)),
          description: getPatternDescription(pattern),
        };
      })
      .sort((a, b) => b.fraudRiskScore - a.fraudRiskScore)
      .slice(0, 15);

    const commonFraudIndicators = patterns
      .filter(p => p.fraudRiskScore > 40)
      .map(p => p.pattern);

    return {
      patterns,
      totalTransactionsAnalyzed: recordsToProcess.length,
      fraudPercentage: (totalFraud / recordsToProcess.length) * 100,
      lastUpdated: new Date(),
      highRiskMerchants: Array.from(highRiskMerchants).slice(0, 10),
      commonFraudIndicators,
    };
  } catch (error) {
    console.error("Dataset processing error:", error);
    throw error;
  }
}

function extractPatterns(record: any, isFraud: boolean): string[] {
  const patterns: string[] = [];

  if (record.PaymentType || record.ProductCD) {
    patterns.push(`payment_${record.PaymentType || record.ProductCD}`);
  }

  if (record.DeviceType) {
    patterns.push(`device_${record.DeviceType}`);
  }

  const amount = parseFloat(record.TransactionAmt || record.Amount || "0");
  if (amount > 100000) patterns.push("amount_100k+");
  else if (amount > 50000) patterns.push("amount_50k-100k");
  else if (amount > 10000) patterns.push("amount_10k-50k");
  else if (amount < 100) patterns.push("amount_under_100");

  if (record.TransactionTime) {
    try {
      const hour = new Date(record.TransactionTime).getHours();
      if (hour >= 0 && hour < 6) patterns.push("time_early_morning");
      else if (hour >= 18 && hour < 24) patterns.push("time_evening");
      else if (hour >= 12 && hour < 18) patterns.push("time_afternoon");
    } catch {
      // Skip
    }
  }

  if (record.Country) {
    patterns.push(`country_${record.Country}`);
  }

  if (record.Browser) {
    patterns.push(`browser_${record.Browser}`);
  }

  return patterns;
}

function getPatternDescription(pattern: string): string {
  const descriptions: Record<string, string> = {
    "payment_S": "Shopping transaction",
    "payment_W": "Withdrawal transaction",
    "payment_C": "Cash transaction",
    "device_desktop": "Desktop device",
    "device_mobile": "Mobile device",
    "amount_100k+": "Very high transaction amount (₹100k+)",
    "amount_50k-100k": "High transaction amount (₹50k-100k)",
    "amount_10k-50k": "Medium-high transaction amount (₹10k-50k)",
    "amount_under_100": "Very low transaction amount",
    "time_early_morning": "Early morning transaction (12am-6am)",
    "time_evening": "Evening transaction (6pm-12am)",
    "time_afternoon": "Afternoon transaction (12pm-6pm)",
  };

  return descriptions[pattern] || pattern;
}
