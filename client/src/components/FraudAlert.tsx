import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check } from "lucide-react";

interface FraudAlertProps {
  merchant: string;
  amount: string;
  reason: string;
  onDismiss?: () => void;
  onConfirm?: () => void;
}

export default function FraudAlert({
  merchant,
  amount,
  reason,
  onDismiss,
  onConfirm,
}: FraudAlertProps) {
  return (
    <Alert variant="destructive" className="border-destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Potential Fraudulent Transaction Detected</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>
            <strong>${parseFloat(amount).toFixed(2)}</strong> at <strong>{merchant}</strong>
          </p>
          <p className="text-sm">Reason: {reason}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onConfirm}
              className="gap-1"
              data-testid="button-confirm-fraud"
            >
              <Check className="h-4 w-4" />
              This is legitimate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDismiss}
              className="gap-1"
              data-testid="button-dismiss-fraud"
            >
              <X className="h-4 w-4" />
              Report as fraud
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
