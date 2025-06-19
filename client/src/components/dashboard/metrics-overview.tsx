import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, PieChart, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MetricsOverview() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="dashboard-card">
            <CardContent className="p-4 lg:p-6">
              <Skeleton className="h-8 w-8 lg:h-12 lg:w-12 rounded-lg mb-3 lg:mb-4" />
              <Skeleton className="h-3 w-16 lg:h-4 lg:w-24 mb-2" />
              <Skeleton className="h-6 w-12 lg:h-8 lg:w-16 mb-3 lg:mb-4" />
              <Skeleton className="h-3 w-14 lg:h-4 lg:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load dashboard metrics</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Competitors",
      value: metrics?.totalCompetitors || 0,
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Avg. Price Point",
      value: `$${metrics?.avgPrice?.toLocaleString() || "0"}`,
      change: "-5%",
      changeType: "negative" as const,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Market Share",
      value: `${metrics?.marketShare?.toFixed(1) || "0"}%`,
      change: "+3%",
      changeType: "positive" as const,
      icon: PieChart,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Trend Score",
      value: metrics?.trendScore?.toFixed(1) || "0",
      change: "+0.8",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="dashboard-card">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{metric.title}</p>
                  <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">{metric.value}</p>
                </div>
                <div className={`w-8 h-8 lg:w-12 lg:h-12 ${metric.iconBg} dark:bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`${metric.iconColor} h-4 w-4 lg:h-6 lg:w-6`} />
                </div>
              </div>
              <div className="mt-3 lg:mt-4 flex items-center">
                <span
                  className={`text-xs lg:text-sm font-medium ${
                    metric.changeType === "positive" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-muted-foreground text-xs lg:text-sm ml-2 mobile-hidden">vs last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
