import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onWheel, onKeyDown, ...props }, ref) => {
    const isNumeric = type === "number";

    // ITEM-13: a focused number input increments on mouse-wheel scroll and on
    // Up/Down arrow keys. Both silently rewrote amounts on payment and rent
    // forms while the operator was only scrolling past the field, so entries
    // were saved against figures nobody typed. Suppress both gestures on every
    // numeric input in the app; explicit callers still get their own handlers.
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Blurring is what actually stops it: the browser only applies the wheel
      // to a number input while it holds focus.
      if (isNumeric) e.currentTarget.blur();
      onWheel?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumeric && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    };

    return (
      <input
        type={type}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
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
