import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertCompetitorSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type FormData = z.infer<typeof insertCompetitorSchema>;

interface AddCompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCompetitorDialog({ open, onOpenChange }: AddCompetitorDialogProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertCompetitorSchema),
    defaultValues: {
      name: "",
      category: "",
      priceRangeMin: "0",
      priceRangeMax: "0",
      marketShare: "0",
      trendStatus: "stable",
    },
  });

  const createCompetitorMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/competitors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Competitor added successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createCompetitorMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Competitor</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter company name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...form.register("category")}
              placeholder="e.g., SaaS Platform, Enterprise Software"
            />
            {form.formState.errors.category && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceRangeMin">Min Price ($)</Label>
              <Input
                id="priceRangeMin"
                type="number"
                step="0.01"
                {...form.register("priceRangeMin")}
                placeholder="0.00"
              />
              {form.formState.errors.priceRangeMin && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.priceRangeMin.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priceRangeMax">Max Price ($)</Label>
              <Input
                id="priceRangeMax"
                type="number"
                step="0.01"
                {...form.register("priceRangeMax")}
                placeholder="0.00"
              />
              {form.formState.errors.priceRangeMax && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.priceRangeMax.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="marketShare">Market Share (%)</Label>
            <Input
              id="marketShare"
              type="number"
              step="0.01"
              max="100"
              {...form.register("marketShare")}
              placeholder="0.00"
            />
            {form.formState.errors.marketShare && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.marketShare.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="trendStatus">Trend Status</Label>
            <Select 
              value={form.watch("trendStatus")} 
              onValueChange={(value) => form.setValue("trendStatus", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trend status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCompetitorMutation.isPending}
            >
              {createCompetitorMutation.isPending ? "Adding..." : "Add Competitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
