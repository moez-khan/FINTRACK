// Utility functions for consistent date formatting across server and client

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysRemaining(deadline: string | Date): number {
  const now = new Date();
  const target = new Date(deadline);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getMonthsRemaining(deadline: string | Date): number {
  const now = new Date();
  const target = new Date(deadline);
  
  const monthsDiff = (target.getFullYear() - now.getFullYear()) * 12 + 
                     (target.getMonth() - now.getMonth());
  
  return Math.max(0, monthsDiff);
}