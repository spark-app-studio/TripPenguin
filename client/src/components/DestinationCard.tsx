import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  cityName: string;
  countryName: string;
  imageUrl: string;
  numberOfNights: number;
  selected?: boolean;
  onClick?: () => void;
  showNights?: boolean;
}

export function DestinationCard({
  cityName,
  countryName,
  imageUrl,
  numberOfNights,
  selected = false,
  onClick,
  showNights = true,
}: DestinationCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-300 hover-elevate active-elevate-2",
        selected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      data-testid={`destination-card-${cityName.toLowerCase()}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={imageUrl}
          alt={`${cityName}, ${countryName}`}
          className="w-full h-full object-cover"
        />
        {selected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <Badge className="bg-primary text-primary-foreground">Selected</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate" data-testid={`text-city-${cityName.toLowerCase()}`}>
              {cityName}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{countryName}</span>
            </div>
          </div>

          {showNights && (
            <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{numberOfNights}n</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
