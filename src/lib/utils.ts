import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate?: string): string {
    if (!birthDate || !isValid(new Date(birthDate))) return 'N/A';
    const age = differenceInYears(new Date(), new Date(birthDate));
    if (age === 0) {
      return "Sơ sinh";
    }
    return `${age} tuổi`;
}
