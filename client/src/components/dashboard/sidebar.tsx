import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  Download,
  Upload,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, current: location === "/" },
    { name: "Competitors", href: "/competitors", icon: Users },
    { name: "Market Trends", href: "/trends", icon: TrendingUp },
    { name: "Pricing Analysis", href: "/pricing", icon: DollarSign },
  ];

  const bulkUploadNav = (user.role === "admin" || user.role === "analyst") ? [
    { name: "Bulk Upload", href: "/bulk-upload", icon: Upload },
  ] : [];

  const adminNavigation = user.role === "admin" ? [
    { name: "User Management", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ] : [];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border">
            <div>
              <h1 className="text-lg lg:text-xl font-bold">CompetitorIQ</h1>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1 capitalize mobile-hidden">{user.role} Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="mobile-hidden">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      item.current || location === item.href
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              );
            })}

            {/* Bulk Upload Section */}
            {bulkUploadNav.length > 0 && (
              <>
                <hr className="my-4 border-border" />
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mobile-hidden">
                  Data Management
                </p>
                {bulkUploadNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          location === item.href
                            ? "text-primary bg-primary bg-opacity-10"
                            : "text-foreground hover:bg-muted hover:bg-opacity-50"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <span className="mobile-hidden sm:inline">{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Admin Section */}
            {adminNavigation.length > 0 && (
              <>
                <hr className="my-4 border-border" />
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mobile-hidden">
                  Administration
                </p>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          location === item.href
                            ? "text-primary bg-primary bg-opacity-10"
                            : "text-foreground hover:bg-muted hover:bg-opacity-50"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <span className="mobile-hidden sm:inline">{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </>
            )}

            <hr className="my-4 border-gray-200" />
            <Link href="/export">
              <a
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onClose}
              >
                <Download className="mr-3 h-5 w-5" />
                Export Reports
              </a>
            </Link>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between lg:hidden">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            
            <div className="bg-muted bg-opacity-50 rounded-lg p-3">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1 min-w-0 mobile-hidden">
                  <p className="text-sm font-medium truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
