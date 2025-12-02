import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  monthlyIncome: string;
  createdAt: string;
}

export default function LoginRegister({ onAuthChange }: { onAuthChange?: () => void }) {
  const [, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  // Register form state - using simple React state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    monthlyIncome: "",
  });

  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // Initialize demo user
  useEffect(() => {
    const users = localStorage.getItem("finance_users");
    if (!users) {
      const demoUser: User = {
        id: "user_demo",
        username: "demo",
        email: "demo@example.com",
        password: "demo123",
        monthlyIncome: "5000",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("finance_users", JSON.stringify({ user_demo: demoUser }));
    }
  }, []);

  // Login form using react-hook-form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onChange",
  });

  // Validation for register form
  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};

    if (!registerData.username) {
      errors.username = "Username is required";
    } else if (registerData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (registerData.username.length > 20) {
      errors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(registerData.username)) {
      errors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (!registerData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!registerData.password) {
      errors.password = "Password is required";
    } else if (registerData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!registerData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const storedUsersStr = localStorage.getItem("finance_users");
      if (!storedUsersStr) {
        setApiError("No users found. Please register first.");
        toast({
          title: "Login Failed",
          description: "No users found",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const storedUsers = JSON.parse(storedUsersStr);
      const user = Object.values(storedUsers).find(
        (u: any) => u.username.toLowerCase() === data.username.toLowerCase()
      ) as User | undefined;

      if (!user) {
        setApiError("Invalid username or password");
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (user.password !== data.password) {
        setApiError("Invalid username or password");
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });

      if (onAuthChange) onAuthChange();

      setTimeout(() => {
        setLocation("/dashboard");
      }, 300);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const storedUsersStr = localStorage.getItem("finance_users");
      const storedUsers = storedUsersStr ? JSON.parse(storedUsersStr) : {};

      const userExists = Object.values(storedUsers).some(
        (u: any) =>
          u.username.toLowerCase() === registerData.username.toLowerCase() ||
          u.email.toLowerCase() === registerData.email.toLowerCase()
      );

      if (userExists) {
        setApiError("Username or email already exists");
        toast({
          title: "Registration Failed",
          description: "Username or email already exists",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        username: registerData.username.toLowerCase(),
        email: registerData.email.toLowerCase(),
        password: registerData.password,
        monthlyIncome: registerData.monthlyIncome || "0",
        createdAt: new Date().toISOString(),
      };

      storedUsers[newUser.id] = newUser;
      localStorage.setItem("finance_users", JSON.stringify(storedUsers));
      localStorage.setItem("currentUser", JSON.stringify(newUser));

      toast({
        title: "Registration Successful",
        description: `Welcome, ${newUser.username}!`,
      });

      if (onAuthChange) onAuthChange();

      setTimeout(() => {
        setLocation("/dashboard");
      }, 300);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setApiError(null);
    setRegisterErrors({});
    setRegisterData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      monthlyIncome: "",
    });
    loginForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 p-4 rounded-xl">
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
                FinanceAI
              </CardTitle>
              <CardDescription className="text-base">
                {isRegister ? "Create your account and start managing your finances" : "Sign in to your account"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {apiError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {isRegister ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    placeholder="john_doe"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    data-testid="input-username-register"
                    disabled={isLoading}
                    className="transition mt-1"
                  />
                  {registerErrors.username && (
                    <p className="text-xs text-destructive mt-1">{registerErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    data-testid="input-email"
                    disabled={isLoading}
                    className="transition mt-1"
                  />
                  {registerErrors.email && (
                    <p className="text-xs text-destructive mt-1">{registerErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      data-testid="input-password-register"
                      disabled={isLoading}
                      className="pr-10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="text-xs text-destructive mt-1">{registerErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      data-testid="input-confirm-password"
                      disabled={isLoading}
                      className="pr-10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{registerErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Monthly Income */}
                <div>
                  <label className="text-sm font-medium">Monthly Income (Optional)</label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={registerData.monthlyIncome}
                    onChange={(e) => setRegisterData({ ...registerData, monthlyIncome: e.target.value })}
                    data-testid="input-income"
                    disabled={isLoading}
                    className="transition mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            {...field}
                            data-testid="input-username-login"
                            disabled={isLoading}
                            className="transition"
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••"
                              {...field}
                              data-testid="input-password-login"
                              disabled={isLoading}
                              className="pr-10 transition"
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              data-testid="button-toggle-login-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-gray-500">
                  {isRegister ? "Already have an account?" : "New to FinanceAI?"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleToggleMode}
              className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30"
              disabled={isLoading}
              data-testid="button-toggle-auth"
            >
              {isRegister ? "Sign In Instead" : "Create New Account"}
            </Button>

            {!isRegister && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Demo Account</p>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-mono">username: demo</span>
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-mono">password: demo123</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Your financial data is secured and stored locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
