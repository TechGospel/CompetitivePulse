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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-20" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="shadow-sm border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${metric.iconColor} h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-medium ${
                    metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-gray-500 text-sm ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
