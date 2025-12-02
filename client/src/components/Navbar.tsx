import { Mountain, Calendar, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <a className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2">
              <Mountain className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold text-xl">AdventureSync</span>
            </a>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard" data-testid="link-dashboard">
              <a>
                <Button
                  variant={location === "/dashboard" ? "secondary" : "ghost"}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Dashboard
                </Button>
              </a>
            </Link>
            <Link href="/meetings" data-testid="link-meetings">
              <a>
                <Button
                  variant={location === "/meetings" ? "secondary" : "ghost"}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Meetings
                </Button>
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              <Badge className="absolute top-1 right-1 h-2 w-2 p-0 bg-destructive" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
