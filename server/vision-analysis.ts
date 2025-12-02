// Google Gemini vision-based OCR and NER analysis for transaction receipts
// Uses OCR/OMR/NCR technologies for receipt reading
import { getPretrainedPatterns } from "./dataset-initialization";

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  extractedText?: string;
  fraudIndicators?: string[];
  rawAmountText?: string;
  transactionType?: "income" | "expense";
}

export interface VisionAnalysisResult {
  isFraudulent: boolean;
  fraudReason?: string;
  riskScore: number;
  receiptData: ReceiptData;
  analysisDetails?: string;
}

// Use Google Gemini vision API (free tier available)
export async function analyzeReceiptWithVision(
  imageBase64: string,
  apiKey?: string
): Promise<VisionAnalysisResult> {
  if (!apiKey) {
    return fallbackReceiptAnalysis(imageBase64);
  }

  try {
    // Use Gemini vision API when key is provided
    const analysisResult = await callGeminiVision(imageBase64, apiKey);
    return analysisResult;
  } catch (error) {
    console.error("Vision analysis error:", error);
    return fallbackReceiptAnalysis(imageBase64);
  }
}

async function callGeminiVision(
  imageBase64: string,
  apiKey: string
): Promise<VisionAnalysisResult> {
  const modelEndpoints = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
  ];
  
  let lastError: Error | null = null;
  
  for (const modelEndpoint of modelEndpoints) {
    try {
      const response = await fetch(modelEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                  },
                },
                {
                  text: `You are an OCR/OMR/NCR receipt scanner. Analyze this receipt/payment screenshot and extract transaction details with maximum accuracy.

CRITICAL OCR INSTRUCTIONS:
1. Look for the rupee symbol (₹) or the word "rupees" or "Rs" or "INR"
2. Extract the EXACT amount immediately after the rupee indicator
3. The amount after "rupees" or "₹" is the ACTUAL transaction amount - this is the most important field
4. Scan ALL text on the receipt carefully
5. Detect if this is money RECEIVED (income) or PAID (expense)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "merchant": "merchant name from receipt",
  "amount": 32,
  "rawAmountText": "₹32.00" or "Rs. 32" or "32 rupees",
  "transactionDirection": "received" or "paid",
  "date": "2024-11-24",
  "extractedText": "all visible text from receipt - include everything you can read",
  "fraudIndicators": [],
  "confidence": 85
}

Amount Extraction Rules:
- PRIORITY: Look for patterns like "₹32", "Rs 32", "INR 32", "32 rupees", "rupees 32"
- amount: Must be the EXACT numeric value. If receipt shows "₹32.50", amount must be 32.50
- rawAmountText: The exact text you found containing the amount
- If multiple amounts exist, use the TOTAL or FINAL amount

Transaction Direction Detection:
- transactionDirection: "received" if text contains "received from", "credited", "deposit", "income", "salary", "refund"
- transactionDirection: "paid" if text contains "paid to", "debited", "payment", "purchase", "expense", "bill"
- Default to "paid" if unclear (most receipts are expenses)

Fraud Detection Rules:
- Check for unusual patterns, duplicate transactions, test/demo keywords
- Flag amounts over ₹50,000 as potentially high-risk
- Look for mismatch between merchant name and transaction type

Return ONLY JSON, nothing else.`,
                },
              ],
            }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        lastError = new Error(`API error: ${error.error?.message || response.status}`);
        continue;
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        lastError = new Error("No response from Gemini API");
        continue;
      }

      // Parse Gemini's JSON response
      const cleanText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      const extractedData = JSON.parse(cleanText);
      
      const amount = parseFloat(extractedData.amount) || 0;
      const rawAmountText = extractedData.rawAmountText || `₹${amount}`;
      
      // Detect transaction direction from OCR or extracted text
      let transactionType: "income" | "expense" = "expense"; // Default to expense
      const extractedText = (extractedData.extractedText || "").toLowerCase();
      const geminiDirection = extractedData.transactionDirection?.toLowerCase();
      
      // Check Gemini's detection first
      if (geminiDirection === "received") {
        transactionType = "income";
      } else if (geminiDirection === "paid") {
        transactionType = "expense";
      } else {
        // Fallback: detect from extracted text keywords
        const incomeKeywords = ["received from", "credited", "deposit", "income", "salary", "refund", "cashback", "reward"];
        const expenseKeywords = ["paid to", "debited", "payment", "purchase", "expense", "bill", "charge"];
        
        const hasIncomeKeyword = incomeKeywords.some(keyword => extractedText.includes(keyword));
        const hasExpenseKeyword = expenseKeywords.some(keyword => extractedText.includes(keyword));
        
        if (hasIncomeKeyword && !hasExpenseKeyword) {
          transactionType = "income";
        }
        // Default remains "expense" if no clear signal
      }
      
      // Start with Gemini-detected indicators (avoid duplicating)
      const fraudIndicators: string[] = [...(extractedData.fraudIndicators || [])];
      const geminiIndicatorCount = fraudIndicators.length;
      
      // Enhanced fraud detection using dataset patterns
      const datasetPatterns = getPretrainedPatterns();
      let datasetFraudScore = 0;
      
      if (datasetPatterns && datasetPatterns.patterns && datasetPatterns.highRiskMerchants) {
        // Check amount patterns from trained dataset (only add if not already flagged by Gemini)
        if (amount > 100000 && !fraudIndicators.some(i => i.toLowerCase().includes('amount'))) {
          fraudIndicators.push("Amount exceeds ₹1,00,000 - High risk based on IEEE dataset");
          datasetFraudScore += 30;
        } else if (amount > 50000 && !fraudIndicators.some(i => i.toLowerCase().includes('amount'))) {
          fraudIndicators.push("Amount exceeds ₹50,000 - Medium-high risk");
          datasetFraudScore += 20;
        }
        
        // Check merchant against high-risk merchants from dataset
        const merchant = (extractedData.merchant || "").toLowerCase();
        const matchesHighRisk = datasetPatterns.highRiskMerchants.some(m => 
          m && merchant.includes(m.toLowerCase())
        );
        if (matchesHighRisk && !fraudIndicators.some(i => i.toLowerCase().includes('merchant'))) {
          fraudIndicators.push("Merchant matches high-risk pattern from fraud dataset");
          datasetFraudScore += 25;
        }
      }
      
      // Calculate risk score - base on dataset only to avoid double counting Gemini flags
      const totalRiskScore = Math.min(100, geminiIndicatorCount * 25 + datasetFraudScore);
      const isFraudulent = totalRiskScore >= 40 || fraudIndicators.length > 0;

      return {
        isFraudulent,
        fraudReason: fraudIndicators[0] || undefined,
        riskScore: totalRiskScore,
        receiptData: {
          merchant: extractedData.merchant || "Unknown",
          amount,
          date: extractedData.date || new Date().toISOString().split('T')[0],
          category: "Payment",
          confidence: extractedData.confidence || 75,
          extractedText: extractedData.extractedText,
          fraudIndicators,
          rawAmountText,
          transactionType,
        },
        analysisDetails: datasetPatterns && datasetPatterns.totalTransactionsAnalyzed
          ? `Analysis used IEEE fraud dataset with ${datasetPatterns.totalTransactionsAnalyzed} pre-trained patterns` 
          : undefined,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Model endpoint ${modelEndpoint} failed:`, error);
      continue;
    }
  }
  
  // All endpoints failed
  throw lastError || new Error("All Gemini API endpoints failed");
}

function fallbackReceiptAnalysis(imageBase64: string): VisionAnalysisResult {
  // Fallback analysis when Gemini API fails
  // We can't process the image directly without OCR, so return default
  // User will be prompted to enter amount manually in frontend
  try {
    return {
      isFraudulent: false,
      riskScore: 0,
      receiptData: {
        merchant: "Receipt Transaction",
        amount: 0, // Will be entered manually by user
        date: new Date().toISOString().split('T')[0],
        category: "Payment",
        confidence: 0,
        extractedText: "API unavailable - please enter amount manually",
        fraudIndicators: [],
      },
      analysisDetails: "⚠️ AI Vision API temporarily unavailable. Amount extraction failed. Please manually enter the amount from your receipt in the next step.",
    };
  } catch (err) {
    return {
      isFraudulent: false,
      riskScore: 0,
      receiptData: {
        merchant: "Receipt Transaction",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: "Payment",
        confidence: 0,
        extractedText: "Unable to extract details",
        fraudIndicators: [],
      },
    };
  }
}

// Fraud indicators detection
export function detectFraudIndicatorsFromReceipt(receiptData: ReceiptData): string[] {
  const indicators: string[] = [];

  // Check for suspicious patterns
  if (receiptData.amount > 500000) {
    indicators.push("Unusually high transaction amount");
  }

  if (receiptData.extractedText) {
    const lowerText = receiptData.extractedText.toLowerCase();

    // Check for known fraud keywords
    if (lowerText.includes("duplicate") || lowerText.includes("retry")) {
      indicators.push("Possible duplicate transaction");
    }
    if (lowerText.includes("unauthorized") || lowerText.includes("failed")) {
      indicators.push("Transaction failure indicators present");
    }
    if (lowerText.includes("test") || lowerText.includes("demo")) {
      indicators.push("Test/demo transaction detected");
    }
  }

  // Combine with Gemini-detected indicators
  if (receiptData.fraudIndicators && receiptData.fraudIndicators.length > 0) {
    indicators.push(...receiptData.fraudIndicators);
  }

  // Remove duplicates using filter
  return indicators.filter((item, index) => indicators.indexOf(item) === index);
}
