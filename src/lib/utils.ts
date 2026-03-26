
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears, isValid, format, isBefore, isEqual, startOfDay } from "date-fns"

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

/**
 * Checks if a given date is on or before the lockdown date.
 * @param dateToCheck The date of the record being checked.
 * @param lockdownDate The lockdown date from settings.
 * @returns True if the date is locked, false otherwise.
 */
export function isDateLocked(dateToCheck: Date | string, lockdownDate: string | null): boolean {
    if (!lockdownDate) {
        return false;
    }
    try {
        const check = startOfDay(new Date(dateToCheck));
        const lock = startOfDay(new Date(lockdownDate));
        
        if (!isValid(check) || !isValid(lock)) {
            return false;
        }
        // A date is locked if it is before or the same as the lockdown date.
        return isEqual(check, lock) || isBefore(check, lock);
    } catch {
        // If date parsing fails, treat as not locked for safety.
        return false;
    }
}
