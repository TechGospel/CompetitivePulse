import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PricingChart() {
  const [timeRange, setTimeRange] = useState("180");

  const { data: trends, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/pricing-trends", { days: timeRange }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/pricing-trends?days=${timeRange}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch pricing trends");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pricing Trends</CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Pricing Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-600">Failed to load pricing trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: trends?.map((item: any) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }) || [],
    datasets: [
      {
        label: "Average Price",
        data: trends?.map((item: any) => parseFloat(item.avgPrice)) || [],
        borderColor: "hsl(207, 90%, 54%)",
        backgroundColor: "hsla(207, 90%, 54%, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "hsl(207, 90%, 54%)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "white",
        titleColor: "hsl(20, 14.3%, 4.1%)",
        bodyColor: "hsl(20, 14.3%, 4.1%)",
        borderColor: "hsl(20, 5.9%, 90%)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "hsl(20, 5.9%, 90%)",
        },
        ticks: {
          callback: (value: any) => `$${value.toLocaleString()}`,
          color: "hsl(25, 5.3%, 44.7%)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "hsl(25, 5.3%, 44.7%)",
        },
      },
    },
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pricing Trends</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
