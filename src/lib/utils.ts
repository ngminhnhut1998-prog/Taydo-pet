import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears, isValid, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate?: string): string {
    if (!birthDate || !isValid(new Date(birthDate))) return 'N/A';
    const age = differenceInYears(new Date(), new Date(birthDate));
    if (age === 0) {
      // If less than a year old, try to return formatted date, or Sơ sinh if invalid
      try {
        return format(new Date(birthDate), 'dd/MM/yyyy');
      } catch (e) {
        return "Sơ sinh";
      }
    }
    return `${age} tuổi`;
}
