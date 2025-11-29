import penguinLogo from "@assets/generated_images/cute_penguin_travel_mascot_logo.png";

interface PenguinLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function PenguinLogo({ className = "", size = "md" }: PenguinLogoProps) {
  const sizeClass = sizeClasses[size];
  
  return (
    <img 
      src={penguinLogo} 
      alt="TripPenguin" 
      className={`${sizeClass} ${className} object-contain`}
      data-testid="img-penguin-logo"
    />
  );
}

export default PenguinLogo;
