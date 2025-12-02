import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/lib/notificationContext";
import FinanceDashboard from "@/pages/FinanceDashboard";
import Insights from "@/pages/Insights";
import Transactions from "@/pages/Transactions";
import BudgetsGoals from "@/pages/BudgetsGoals";
import LoginRegister from "@/pages/LoginRegister";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FinanceDashboard} />
      <Route path="/dashboard" component={FinanceDashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/budgets" component={BudgetsGoals} />
      <Route path="/insights" component={Insights} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in via localStorage
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        JSON.parse(currentUser); // Validate it's valid JSON
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("currentUser");
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthChange = () => {
    const currentUser = localStorage.getItem("currentUser");
    setIsAuthenticated(!!currentUser);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Loading FinanceAI...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          {!isAuthenticated ? (
            <LoginRegister onAuthChange={handleAuthChange} />
          ) : (
            <Router />
          )}
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
