import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-[oklch(0.42_0.20_252)] text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.18),inset_0_1px_0_oklch(1_0_0/0.10)] hover:shadow-[var(--shadow-glow)] hover:from-[oklch(0.52_0.20_252)] hover:to-primary hover:-translate-y-px",
        destructive:
          "bg-gradient-to-b from-destructive to-[oklch(0.50_0.22_24)] text-destructive-foreground shadow-sm hover:from-[oklch(0.60_0.22_24)] hover:to-destructive hover:-translate-y-px hover:shadow-[0_0_16px_oklch(0.56_0.22_24/0.30)]",
        outline:
          "border border-border bg-card text-foreground shadow-[var(--shadow-soft)] hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:-translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:bg-secondary/70 hover:-translate-y-px",
        ghost:
          "text-foreground/70 hover:bg-muted hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-lg px-5 text-sm",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
