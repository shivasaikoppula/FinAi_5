import { DollarSign, LayoutDashboard, Receipt, Target, TrendingUp, Bell, Shield, LogOut, Lock, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notificationContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FinanceNavbar({ onLogout }: { onLogout?: () => void }) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { notifications, clearNotifications } = useNotifications();
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    if (onLogout) onLogout();
    window.location.href = "/";
  };

  const handleSecurityClick = () => {
    setShowSecurityDialog(true);
  };

  const handleNotificationsClick = () => {
    setShowNotificationsDialog(true);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2 cursor-pointer">
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold text-xl">Finance AI</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard" data-testid="link-dashboard">
              <Button
                variant={location === "/dashboard" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/transactions" data-testid="link-transactions">
              <Button
                variant={location === "/transactions" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                Transactions
              </Button>
            </Link>
            <Link href="/budgets" data-testid="link-budgets">
              <Button
                variant={location === "/budgets" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Budgets & Goals
              </Button>
            </Link>
            <Link href="/insights" data-testid="link-insights">
              <Button
                variant={location === "/insights" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Insights
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSecurityClick}
              data-testid="button-security"
              title="Security Settings"
            >
              <Shield className="h-5 w-5 text-accent" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationsClick}
              data-testid="button-notifications"
              title="Notifications"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <Badge className="absolute top-1 right-1 h-5 w-5 p-0 bg-destructive text-white text-xs flex items-center justify-center">
                  {notifications.length}
                </Badge>
              )}
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-navbar-logout"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Security Dialog */}
      <Dialog open={showSecurityDialog} onOpenChange={setShowSecurityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" />
              Security Settings
            </DialogTitle>
            <DialogDescription>
              Manage your account security and privacy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="font-semibold text-green-600 dark:text-green-400">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your financial data is encrypted and stored locally in your browser with advanced security measures.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold">Privacy First</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We don't share your data with third parties. All transactions are analyzed locally.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Coming soon: Enable 2FA to add an extra layer of security to your account.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold">Session Security</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your session is automatically secured with encrypted tokens and session management.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications ({notifications.length})
            </DialogTitle>
            <DialogDescription>
              Your recent fraud alerts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="border rounded-lg p-3 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-destructive text-sm">
                        ⚠️ Fraud Alert: {notif.merchant}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount: ₹{notif.amount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {notif.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notif.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No fraud alerts. Your account is secure!</p>
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              className="w-full mt-2"
              data-testid="button-clear-notifications"
            >
              Clear All
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </nav>
  );
}
