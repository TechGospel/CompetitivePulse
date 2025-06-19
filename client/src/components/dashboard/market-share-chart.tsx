import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MarketShareChart() {
  const { data: competitors, isLoading, error } = useQuery({
    queryKey: ["/api/competitors"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Market Share Distribution</CardTitle>
            <Skeleton className="h-8 w-24" />
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
          <CardTitle>Market Share Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-600">Failed to load market share data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!competitors || competitors.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Market Share Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">No competitor data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort competitors by market share and take top 5
  const topCompetitors = [...competitors]
    .sort((a, b) => parseFloat(b.marketShare) - parseFloat(a.marketShare))
    .slice(0, 5);

  const colors = [
    "hsl(207, 90%, 54%)",
    "hsl(159, 75%, 40%)",
    "hsl(0, 84%, 60%)",
    "hsl(45, 93%, 58%)",
    "hsl(224, 71%, 66%)",
  ];

  const chartData = {
    labels: topCompetitors.map((comp) => comp.name),
    datasets: [
      {
        data: topCompetitors.map((comp) => parseFloat(comp.marketShare)),
        backgroundColor: colors,
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: "hsl(20, 14.3%, 4.1%)",
        },
      },
      tooltip: {
        backgroundColor: "white",
        titleColor: "hsl(20, 14.3%, 4.1%)",
        bodyColor: "hsl(20, 14.3%, 4.1%)",
        borderColor: "hsl(20, 5.9%, 90%)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}%`,
        },
      },
    },
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Share Distribution</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
