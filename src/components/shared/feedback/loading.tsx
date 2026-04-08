import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SdrLoadingProps {
  className?: string;
}

export function SdrLoading({ className }: SdrLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading SDR data...</p>
      </div>
    </div>
  );
}
