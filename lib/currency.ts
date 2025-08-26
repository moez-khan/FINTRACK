// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka' },
  LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee' },
  NPR: { symbol: 'रू', name: 'Nepalese Rupee' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal' },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  BHD: { symbol: 'د.ب', name: 'Bahraini Dinar' },
  OMR: { symbol: 'ر.ع', name: 'Omani Rial' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  PHP: { symbol: '₱', name: 'Philippine Peso' },
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  MXN: { symbol: '$', name: 'Mexican Peso' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  PLN: { symbol: 'zł', name: 'Polish Złoty' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint' },
} as const;

export type Currency = keyof typeof SUPPORTED_CURRENCIES;

// Format amount with currency symbol
export function formatCurrency(amount: number, currency: Currency = 'USD', compact: boolean = false): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) return `$${amount.toFixed(2)}`;

  // Compact formatting for charts
  if (compact) {
    if (Math.abs(amount) >= 1000000) {
      return `${currencyInfo.symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 1000) {
      return `${currencyInfo.symbol}${(amount / 1000).toFixed(1)}k`;
    }
    return `${currencyInfo.symbol}${amount.toFixed(0)}`;
  }

  // Special formatting for specific currencies
  if (currency === 'JPY' || currency === 'KRW' || currency === 'VND' || currency === 'IDR') {
    // These currencies typically don't use decimal places
    return `${currencyInfo.symbol}${Math.round(amount).toLocaleString()}`;
  }

  if (currency === 'INR') {
    // Indian numbering system
    return `${currencyInfo.symbol}${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  if (currency === 'PKR' || currency === 'BDT' || currency === 'NPR' || currency === 'LKR') {
    // South Asian numbering system
    return `${currencyInfo.symbol}${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  }

  if (currency === 'BHD' || currency === 'KWD' || currency === 'OMR') {
    // These currencies use 3 decimal places
    return `${currencyInfo.symbol}${amount.toFixed(3)}`;
  }

  // Default formatting with 2 decimal places
  return `${currencyInfo.symbol}${amount.toFixed(2)}`;
}

// Get currency symbol only
export function getCurrencySymbol(currency: Currency = 'USD'): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || '$';
}

// Get currency name
export function getCurrencyName(currency: Currency = 'USD'): string {
  return SUPPORTED_CURRENCIES[currency]?.name || 'US Dollar';
}

// Get list of all supported currencies for dropdown
export function getCurrencyOptions() {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    value: code as Currency,
    label: `${code} - ${info.name}`,
    symbol: info.symbol
  }));
}