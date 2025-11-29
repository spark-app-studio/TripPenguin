import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepperProps {
  currentStep: number;
  completedSteps: number[];
}

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  const steps: Step[] = [
    {
      number: 1,
      title: "Dream",
      subtitle: "Quiz & Itinerary",
      completed: completedSteps.includes(1),
      current: currentStep === 1,
    },
    {
      number: 2,
      title: "Save & Book",
      subtitle: "Budget & Book as You Save",
      completed: completedSteps.includes(2),
      current: currentStep === 2,
    },
    {
      number: 3,
      title: "Go",
      subtitle: "Trip in Progress",
      completed: completedSteps.includes(3),
      current: currentStep === 3,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-border -z-10">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center flex-1">
            {/* Step circle */}
            <div
              className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background",
                step.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.current
                  ? "border-primary text-primary scale-110"
                  : "border-border text-muted-foreground"
              )}
              data-testid={`step-${step.number}-indicator`}
            >
              {step.completed ? (
                <Check className="w-6 h-6" />
              ) : (
                <span className="text-lg font-semibold">{step.number}</span>
              )}
            </div>

            {/* Step label */}
            <div className="mt-3 text-center">
              <p
                className={cn(
                  "text-base font-semibold",
                  step.current ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {step.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
