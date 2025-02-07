import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getUserTimezoneDateYYYYMMDD(date: Date, timezone: string = 'UTC'): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
}
