import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() merges class names: clsx handles conditional classes, twMerge dedupes
// conflicting Tailwind classes (e.g. "px-2 px-4" -> "px-4"). Every shadcn
// component uses it so `className` props override defaults cleanly.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
