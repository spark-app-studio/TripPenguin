import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingItemProps {
  itemName: string;
  category: string;
  status: "not_started" | "in_progress" | "booked";
  estimatedCost: number;
  actualCost?: number;
  onStatusChange: (status: "not_started" | "in_progress" | "booked") => void;
  onAIBookingClick?: () => void;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    variant: "default" as const,
    color: "text-primary",
  },
  booked: {
    label: "Booked",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
  },
};

export function BookingItem({
  itemName,
  category,
  status,
  estimatedCost,
  actualCost,
  onStatusChange,
  onAIBookingClick,
}: BookingItemProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const handleStatusCycle = () => {
    if (status === "not_started") {
      onStatusChange("in_progress");
    } else if (status === "in_progress") {
      onStatusChange("booked");
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`booking-item-${itemName.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-base truncate">{itemName}</h4>
                <p className="text-sm text-muted-foreground capitalize">{category}</p>
              </div>
              <Badge
                variant={config.variant}
                className={cn("flex items-center gap-1 flex-shrink-0", config.color)}
                data-testid={`badge-status-${status}`}
              >
                <Icon className={cn("w-3 h-3", status === "in_progress" && "animate-spin")} />
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated:</span>
              <span className="font-medium">${estimatedCost.toFixed(2)}</span>
            </div>

            {actualCost !== undefined && actualCost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actual:</span>
                <span className={cn(
                  "font-semibold",
                  actualCost > estimatedCost ? "text-destructive" : "text-green-600"
                )}>
                  ${actualCost.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={status === "booked" ? "secondary" : "default"}
                onClick={handleStatusCycle}
                disabled={status === "booked"}
                className="flex-1"
                data-testid="button-update-status"
              >
                {status === "not_started" && "Start Booking"}
                {status === "in_progress" && "Mark as Booked"}
                {status === "booked" && "Completed"}
              </Button>

              {onAIBookingClick && status !== "booked" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAIBookingClick}
                  className="flex-shrink-0"
                  data-testid="button-ai-booking"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Assist
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
