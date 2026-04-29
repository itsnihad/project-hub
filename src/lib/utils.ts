import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateValues(amount: number, collaborationPercent: number = 0) {
  const revenue = amount * 0.2;
  const value = amount - revenue;
  const collaborationDeduction = value * (collaborationPercent / 100);
  const finalValue = value - collaborationDeduction;

  return {
    revenue,
    value,
    finalValue,
    collaborationDeduction
  };
}
