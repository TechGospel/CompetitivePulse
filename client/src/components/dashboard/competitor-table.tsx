import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddCompetitorDialog from "@/components/dialogs/add-competitor-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitorTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: competitors, isLoading, error } = useQuery({
    queryKey: ["/api/competitors"],
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/competitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Competitor deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCompetitors = competitors?.filter((comp: any) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getTrendIcon = (status: string) => {
    switch (status) {
      case "growing":
        return <TrendingUp className="w-3 h-3 mr-1" />;
      case "declining":
        return <TrendingDown className="w-3 h-3 mr-1" />;
      default:
        return <Minus className="w-3 h-3 mr-1" />;
    }
  };

  const getTrendColor = (status: string) => {
    switch (status) {
      case "growing":
        return "bg-green-100 text-green-800";
      case "declining":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const canEdit = user?.role === "admin" || user?.role === "analyst";
  const canDelete = user?.role === "admin";

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center space-x-3 mt-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Competitor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load competitors</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle>Competitor Analysis</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Filter competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {canEdit && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCompetitors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No competitors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Trend</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompetitors.map((competitor: any) => {
                    const initials = competitor.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={competitor.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{competitor.name}</p>
                              <p className="text-sm text-gray-500">{competitor.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">
                            ${parseFloat(competitor.priceRangeMin).toLocaleString()} - ${parseFloat(competitor.priceRangeMax).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 w-16">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(parseFloat(competitor.marketShare), 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {parseFloat(competitor.marketShare).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(competitor.updatedAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${getTrendColor(competitor.trendStatus)}`}>
                            {getTrendIcon(competitor.trendStatus)}
                            {competitor.trendStatus}
                          </Badge>
                        </TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {canEdit && (
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCompetitorMutation.mutate(competitor.id)}
                                  disabled={deleteCompetitorMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination placeholder */}
          {filteredCompetitors.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing <strong>1-{filteredCompetitors.length}</strong> of <strong>{competitors?.length || 0}</strong> competitors
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button size="sm">1</Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCompetitorDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </>
  );
}
