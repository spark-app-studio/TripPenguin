import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

function calculatePasswordStrength(password: string): StrengthResult {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, label: "No password", color: "bg-gray-300", feedback: [] };
  }

  // Length check
  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push("Use at least 8 characters");
  }

  if (password.length >= 12) {
    score += 10;
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push("Add numbers");
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push("Add special characters (!@#$%^&*)");
  }

  // Determine label and color
  let label = "";
  let color = "";

  if (score < 40) {
    label = "Weak";
    color = "bg-red-500";
  } else if (score < 60) {
    label = "Fair";
    color = "bg-orange-500";
  } else if (score < 80) {
    label = "Good";
    color = "bg-yellow-500";
  } else if (score < 100) {
    label = "Strong";
    color = "bg-green-500";
  } else {
    label = "Very Strong";
    color = "bg-green-600";
  }

  return { score, label, color, feedback };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${
          strength.score < 40 ? "text-red-600" :
          strength.score < 60 ? "text-orange-600" :
          strength.score < 80 ? "text-yellow-600" :
          "text-green-600"
        }`}>
          {strength.label}
        </span>
      </div>
      
      <Progress value={strength.score} className="h-2" />
      
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          {strength.feedback.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-red-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

