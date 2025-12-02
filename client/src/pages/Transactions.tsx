import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useNotifications } from "@/lib/notificationContext";
import FinanceNavbar from "@/components/FinanceNavbar";
import TransactionCard from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Search, Image, LogOut } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showScreenshotDialog, setShowScreenshotDialog] = useState(false);
  const [addFormCategory, setAddFormCategory] = useState("Other");
  const [addFormType, setAddFormType] = useState<"income" | "expense">("expense");
  const [newTransactionIds, setNewTransactionIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const transactionListRef = useRef<HTMLDivElement>(null);

  // Get userId from localStorage (current user)
  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userId = currentUser?.id || "";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userId) {
      setLocation("/");
    }
  }, [userId, setLocation]);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userId],
    enabled: !!userId,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: (data) => {
      setNewTransactionIds(prev => new Set(prev).add(data.transaction.id));
      setTimeout(() => {
        setNewTransactionIds(prev => {
          const updated = new Set(prev);
          updated.delete(data.transaction.id);
          return updated;
        });
      }, 5000);
      
      // Clear cache and force refetch across all pages
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-health', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      
      formRef.current?.reset();
      setAddFormCategory("Other");
      setShowAddDialog(false);
      
      setTimeout(() => {
        transactionListRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      toast({
        title: "✓ Transaction added",
        description: "Check the transaction list below",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      const response = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload CSV');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Clear cache and force refetch across all pages
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-health', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      setShowUploadDialog(false);
      
      setTimeout(() => {
        transactionListRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      toast({
        title: "✓ CSV uploaded successfully",
        description: `Imported ${data.created} transactions • Scroll down to see them`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.merchant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Show new transactions first
      const aIsNew = newTransactionIds.has(a.id);
      const bIsNew = newTransactionIds.has(b.id);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      // Then sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createTransactionMutation.mutate({
      userId,
      date: formData.get('date'),
      amount: formData.get('amount'),
      merchant: formData.get('merchant'),
      category: addFormCategory,
      type: addFormType,
      description: formData.get('description') || null,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCSVMutation.mutate(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation("/login");
  };

  const uploadScreenshotMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      const response = await fetch('/api/transactions/screenshot', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze screenshot');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setShowScreenshotDialog(false);
      
      // Transaction is auto-created when amount is detected via OCR
      if (data.transaction) {
        // Track new transaction for visual highlight
        setNewTransactionIds(prev => new Set(prev).add(data.transaction.id));
        setTimeout(() => {
          setNewTransactionIds(prev => {
            const updated = new Set(prev);
            updated.delete(data.transaction.id);
            return updated;
          });
        }, 5000);
        
        // Invalidate queries to trigger immediate refetch
        queryClient.refetchQueries({ queryKey: ['/api/transactions', userId] });
        queryClient.refetchQueries({ queryKey: ['/api/financial-health', userId] });
        queryClient.refetchQueries({ queryKey: ['/api/budgets', userId] });
        queryClient.refetchQueries({ queryKey: ['/api/goals', userId] });
        
        const amount = parseFloat(data.transaction.amount).toFixed(2);
        const merchant = data.transaction.merchant;
        const isIncome = data.transactionType === 'income';
        
        // Add fraud notification if fraudulent
        if (data.isFraudulent) {
          addNotification({
            id: data.transaction.id,
            merchant: merchant,
            amount: amount,
            timestamp: new Date(),
            reason: data.fraudReason || "Suspicious transaction pattern detected",
          });
        }
        
        setTimeout(() => {
          transactionListRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Show different message for income vs expense
        toast({
          title: isIncome ? `✓ Received ₹${amount}` : `✓ Paid ₹${amount}`,
          description: isIncome ? `From: ${merchant}` : `To: ${merchant}`,
          variant: data.isFraudulent ? "destructive" : "default",
        });
      } else {
        // Only show manual dialog if OCR completely failed to extract amount
        toast({
          title: "Could not extract amount",
          description: "Please try uploading a clearer image",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadScreenshotMutation.mutate(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FinanceNavbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">
              Transactions
            </h1>
            <p className="text-muted-foreground">
              View and manage all your transactions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              className="gap-2"
              data-testid="button-upload-csv"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
            <Button
              onClick={() => setShowScreenshotDialog(true)}
              variant="outline"
              className="gap-2"
              data-testid="button-upload-screenshot"
            >
              <Image className="h-4 w-4" />
              Scan Receipt
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="gap-2 ml-auto"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search merchants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-transactions"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="Groceries">Groceries</SelectItem>
              <SelectItem value="Food & Dining">Food & Dining</SelectItem>
              <SelectItem value="Transportation">Transportation</SelectItem>
              <SelectItem value="Shopping">Shopping</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading transactions...</div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-2" ref={transactionListRef}>
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                id={transaction.id}
                merchant={transaction.merchant}
                amount={transaction.amount}
                category={transaction.category}
                date={new Date(transaction.date)}
                type={transaction.type as "income" | "expense"}
                isFraudulent={transaction.isFraudulent}
                isInINR={transaction.description?.includes("Receipt scan") || false}
                isNew={newTransactionIds.has(transaction.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            No transactions found matching your filters.
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setAddFormCategory("Other");
          setAddFormType("expense");
        }
      }}>
        <DialogContent data-testid="dialog-add-transaction">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Enter the transaction details below</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleAddTransaction}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="merchant">Merchant</Label>
                <Input id="merchant" name="merchant" required data-testid="input-merchant" />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={addFormType} onValueChange={(value) => setAddFormType(value as "income" | "expense")}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense (Money Out)</SelectItem>
                    <SelectItem value="income">Income (Money In)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  data-testid="input-amount"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={addFormCategory} onValueChange={setAddFormCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Other">Other (Auto-categorize)</SelectItem>
                    <SelectItem value="Groceries">Groceries</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  data-testid="input-date"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" name="description" data-testid="input-description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createTransactionMutation.isPending} data-testid="button-submit-transaction">
                {createTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload CSV Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent data-testid="dialog-upload-csv">
          <DialogHeader>
            <DialogTitle>Upload Transactions CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: date, amount, merchant, category, description
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploadCSVMutation.isPending}
              data-testid="input-csv-file"
            />
          </div>
          {uploadCSVMutation.isPending && (
            <div className="text-sm text-muted-foreground">Uploading and processing...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Screenshot Upload Dialog */}
      <Dialog open={showScreenshotDialog} onOpenChange={setShowScreenshotDialog}>
        <DialogContent data-testid="dialog-upload-screenshot">
          <DialogHeader>
            <DialogTitle>Scan Transaction Receipt</DialogTitle>
            <DialogDescription>
              Upload a screenshot or image of your receipt. Our AI will analyze it and check for fraud.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              disabled={uploadScreenshotMutation.isPending}
              data-testid="input-screenshot-file"
            />
          </div>
          {uploadScreenshotMutation.isPending && (
            <div className="text-sm text-muted-foreground">Analyzing image...</div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
