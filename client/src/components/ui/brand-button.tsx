import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brandButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-maroon focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-maroon text-white hover:bg-brand-maroon/90 shadow-lg hover:shadow-xl",
        secondary: "bg-brand-sky text-brand-ink hover:bg-brand-maroon hover:text-white border border-brand-sky",
        outline: "border border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white",
        ghost: "hover:bg-brand-sky hover:text-brand-maroon",
        gold: "bg-brand-gold text-brand-ink hover:bg-brand-gold/90 shadow-lg",
        ink: "bg-brand-ink text-white hover:bg-brand-stone shadow-lg"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12"
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "hover:animate-bounce",
        glow: "hover:shadow-2xl hover:shadow-brand-maroon/25"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "glow"
    },
  }
);

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof brandButtonVariants> {
  asChild?: boolean;
}

const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, variant, size, animation, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(brandButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
BrandButton.displayName = "BrandButton";

export { BrandButton, brandButtonVariants };
