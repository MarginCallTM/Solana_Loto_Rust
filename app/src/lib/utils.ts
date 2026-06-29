import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge any number of class values, then resolve Tailwind conflicts.
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}