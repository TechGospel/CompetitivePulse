import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import MetricsOverview from "@/components/dashboard/metrics-overview";
import PricingChart from "@/components/dashboard/pricing-chart";
import MarketShareChart from "@/components/dashboard/market-share-chart";
import CompetitorTable from "@/components/dashboard/competitor-table";
import UserManagement from "@/components/dashboard/user-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        {/* Top Navigation */}
        <header className="bg-card border-b border-border px-3 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2 p-1"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg lg:text-2xl font-bold truncate">
                <span className="hidden sm:inline">Market Intelligence Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </h2>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search competitors..."
                  className="pl-10 w-48 lg:w-64"
                />
              </div>

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 lg:space-x-2 p-1 lg:p-2">
                    <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground mobile-hidden" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-3 lg:p-6 xl:p-8 space-y-4 lg:space-y-6 xl:space-y-8">
          {/* Metrics Overview */}
          <MetricsOverview />

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
            <PricingChart />
            <MarketShareChart />
          </div>

          {/* Competitor Table */}
          <CompetitorTable />

          {/* User Management (Admin Only) */}
          {user.role === "admin" && <UserManagement />}
        </div>
      </main>
    </div>
  );
}
