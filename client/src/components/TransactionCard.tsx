import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Coffee, Car, Home, Heart, Smartphone, AlertTriangle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { formatINR } from "@/lib/currency";

interface TransactionCardProps {
  id: string;
  merchant: string;
  amount: string;
  category: string;
  date: Date;
  type: "income" | "expense";
  isFraudulent?: boolean;
  isInINR?: boolean;
  isNew?: boolean;
}

const categoryIcons: Record<string, any> = {
  "Shopping": ShoppingCart,
  "Food & Dining": Coffee,
  "Transportation": Car,
  "Groceries": Home,
  "Healthcare": Heart,
  "Entertainment": Smartphone,
};

export default function TransactionCard({
  id,
  merchant,
  amount,
  category,
  date,
  type,
  isFraudulent,
  isInINR = false,
  isNew = false,
}: TransactionCardProps) {
  const Icon = categoryIcons[category] || ShoppingCart;
  const amountNum = parseFloat(amount);
  const isPositive = type === "income";
  
  // All amounts are now stored in INR, display as is
  const displayAmount = Math.abs(amountNum);
  const transactionLabel = isPositive ? "Received from" : "Paid to";
  const accountLabel = isPositive ? "Credited to" : "Debited from";
  
  // Get relative time display
  const getTimeDisplay = (dateObj: Date) => {
    const now = new Date();
    if (isToday(dateObj)) {
      const diffMinutes = Math.floor((now.getTime() - dateObj.getTime()) / 60000);
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
    if (isYesterday(dateObj)) {
      return "Yesterday";
    }
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };
  
  const timeDisplay = getTimeDisplay(date);

  return (
    <div
      className={`flex items-center justify-between p-5 rounded-lg hover-elevate active-elevate-2 cursor-pointer border ${
        isNew ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/20' : 'bg-card'
      }`}
      data-testid={`transaction-${id}`}
    >
      {/* Left Side: Icon and Transaction Details */}
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-3 rounded-lg shrink-0 ${isPositive ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
          {isPositive ? (
            <ArrowDownLeft className="h-6 w-6" />
          ) : (
            <ArrowUpRight className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{transactionLabel}</p>
          <p className="text-lg font-semibold text-foreground">{merchant}</p>
          <p className="text-sm text-muted-foreground">{timeDisplay}</p>
        </div>
      </div>

      {/* Right Side: Amount and Account Badge */}
      <div className="flex flex-col items-end gap-2">
        <p className={`text-xl font-bold font-mono ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          ₹{formatINR(Math.abs(displayAmount))}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{accountLabel}</span>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs bg-amber-100 text-amber-900">👤</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col gap-1">
          {isNew && (
            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
              New
            </Badge>
          )}
          {isFraudulent && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Fraud Alert
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
