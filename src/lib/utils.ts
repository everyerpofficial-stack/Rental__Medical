import type React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Coerce a stored field to a string before any string method touches it.
 *
 * Google Sheets hands numeric-looking cells back as JS *numbers*, not strings:
 * phone numbers, PIN codes, Aadhaar numbers and all-digit PANs all arrive as
 * numbers, and the background sync writes them into localStorage exactly as
 * received. Anything that then calls `.trim()` / `.replace()` on such a value
 * throws a TypeError, which in a form's save handler surfaces as "the button
 * does nothing".
 */
export const asText = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

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
