import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm font-medium shadow-[var(--shadow-inner)] transition-all duration-150",
          "placeholder:text-muted-foreground/60 placeholder:font-normal",
          "hover:border-border/80",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/15 focus-visible:bg-card",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
