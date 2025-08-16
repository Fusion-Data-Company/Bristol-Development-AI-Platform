import { cn } from "@/lib/utils";

interface ThreeDEffectLoaderProps {
  className?: string;
}

export function ThreeDEffectLoader({ className }: ThreeDEffectLoaderProps) {
  return (
    <div className={cn("pl", className)}>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__text">Loading…</div>
    </div>
  );
}

// Demo component for testing
export function DemoThreeDLoader() {
  return <ThreeDEffectLoader />;
}