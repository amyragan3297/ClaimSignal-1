import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface PrivacyTextProps {
  value: string;
  maskedValue: string;
  className?: string;
  showToggle?: boolean;
}

/**
 * Displays text with privacy protection.
 * - Team users: Always see full data (no masking)
 * - Individual users: See masked data with optional toggle to reveal
 * - Non-authenticated: See masked data
 */
export function PrivacyText({ value, maskedValue, className, showToggle = false }: PrivacyTextProps) {
  const { userType, authenticated } = useAuth();
  const [revealed, setRevealed] = useState(false);
  
  // Team members always see full data - no masking needed
  const isTeamUser = authenticated && userType === 'team';
  
  if (isTeamUser) {
    return <span className={className}>{value}</span>;
  }
  
  // For individual users or non-authenticated, show masked with optional toggle
  if (showToggle) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 group", className)}>
        <span>{revealed ? value : maskedValue}</span>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="opacity-50 hover:opacity-100 transition-opacity"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </span>
    );
  }
  
  return (
    <span 
      className={cn(
        "cursor-help transition-all duration-200",
        "hover:bg-primary/10 hover:px-1 hover:-mx-1 rounded",
        className
      )}
      title="Hover to reveal"
      onMouseEnter={(e) => {
        e.currentTarget.textContent = value;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.textContent = maskedValue;
      }}
    >
      {maskedValue}
    </span>
  );
}
