import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str.replace(/(?:^|\s|-|\/)([a-z])/g, (match) => match.toUpperCase());
}
