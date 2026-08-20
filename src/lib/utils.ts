import type React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str.replace(/(?:^|\s|-|\/)([a-z])/g, (match) => match.toUpperCase());
}

/**
 * Props that stop a number input from silently mutating its value when the
 * user scrolls the wheel over it or taps the Up/Down arrow keys — both of
 * which have caused wrong amounts to be recorded on payment forms.
 *
 * @example <Input type="number" {...numericInputGuard} value={amt} … />
 */
export const numericInputGuard = {
  onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
    // Blurring is what actually stops it: a number input only responds to the
    // wheel while focused, so dropping focus makes the gesture a no-op.
    e.currentTarget.blur();
  },
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  },
} as const;
