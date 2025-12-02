import { GoogleGenerativeAI } from "@google/generative-ai";

interface CSVAnalysis {
  creditColumn?: string;
  debitColumn?: string;
  dateColumn?: string;
  merchantColumn?: string;
  hasCreditsColumn: boolean;
  hasDebitsColumn: boolean;
}

export async function analyzeCSVStructure(
  csvContent: string,
  apiKey: string | undefined
): Promise<CSVAnalysis> {
  if (!apiKey) {
    return {
      hasCreditsColumn: false,
      hasDebitsColumn: false,
    };
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get first few rows for analysis
    const lines = csvContent.split("\n").slice(0, 10).join("\n");

    const prompt = `You are a CSV analyzer. Analyze this CSV data and identify:
1. Which column represents CREDITS (money coming in/received/deposits)
2. Which column represents DEBITS (money going out/expenses/withdrawals)
3. Which column is DATE
4. Which column is MERCHANT/DESCRIPTION

Return a JSON response with fields: creditColumn, debitColumn, dateColumn, merchantColumn (use exact column names from the CSV header).

CSV Data:
${lines}

Return ONLY valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          creditColumn: parsed.creditColumn,
          debitColumn: parsed.debitColumn,
          dateColumn: parsed.dateColumn,
          merchantColumn: parsed.merchantColumn,
          hasCreditsColumn: !!parsed.creditColumn,
          hasDebitsColumn: !!parsed.debitColumn,
        };
      }
    } catch (e) {
      console.error("Failed to parse CSV analysis:", e);
    }

    return {
      hasCreditsColumn: false,
      hasDebitsColumn: false,
    };
  } catch (error) {
    console.error("CSV analysis error:", error);
    return {
      hasCreditsColumn: false,
      hasDebitsColumn: false,
    };
  }
}

export function detectTransactionType(
  record: Record<string, string>,
  analysis: CSVAnalysis
): "income" | "expense" {
  // If analysis found credit/debit columns, use them
  if (analysis.creditColumn && record[analysis.creditColumn]) {
    const creditValue = parseFloat(record[analysis.creditColumn]);
    if (!isNaN(creditValue) && creditValue > 0) {
      return "income";
    }
  }

  if (analysis.debitColumn && record[analysis.debitColumn]) {
    const debitValue = parseFloat(record[analysis.debitColumn]);
    if (!isNaN(debitValue) && debitValue > 0) {
      return "expense";
    }
  }

  // Fallback: check column names for keywords
  const columnNames = Object.keys(record).map((k) => k.toLowerCase());
  
  for (const col of columnNames) {
    if (col.includes("credit") || col.includes("deposit") || col.includes("received")) {
      const val = parseFloat(record[Object.keys(record).find(k => k.toLowerCase() === col) || ""]);
      if (!isNaN(val) && val > 0) return "income";
    }
    if (col.includes("debit") || col.includes("withdrawal") || col.includes("expense")) {
      const val = parseFloat(record[Object.keys(record).find(k => k.toLowerCase() === col) || ""]);
      if (!isNaN(val) && val > 0) return "expense";
    }
  }

  // Default to expense
  return "expense";
}

export function extractAmountFromRecord(
  record: Record<string, string>,
  analysis: CSVAnalysis,
  type: "income" | "expense"
): string {
  // Try to find amount from credit/debit columns first
  if (type === "income" && analysis.creditColumn && record[analysis.creditColumn]) {
    return record[analysis.creditColumn];
  }
  if (type === "expense" && analysis.debitColumn && record[analysis.debitColumn]) {
    return record[analysis.debitColumn];
  }

  // Fallback: look for amount columns
  for (const key of Object.keys(record)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("amount") || keyLower.includes("total") || keyLower === "value") {
      return record[key];
    }
  }

  return record.amount || "0";
}
