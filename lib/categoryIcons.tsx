import {
  ShoppingCartIcon,
  HomeIcon,
  TruckIcon,
  BoltIcon,
  ShieldCheckIcon,
  HeartIcon,
  ShoppingBagIcon,
  FilmIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  PlayIcon,
  BanknotesIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  EllipsisHorizontalIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  GiftIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Expense category icons
export const EXPENSE_CATEGORY_ICONS: Record<string, any> = {
  // Needs
  Groceries: ShoppingCartIcon,
  Rent: HomeIcon,
  Transport: TruckIcon,
  Utilities: BoltIcon,
  Insurance: ShieldCheckIcon,
  Healthcare: HeartIcon,
  Bills: BanknotesIcon,
  
  // Wants
  Shopping: ShoppingBagIcon,
  Entertainment: FilmIcon,
  Dining: UserGroupIcon,
  Hobbies: AcademicCapIcon,
  Travel: GlobeAltIcon,
  Subscriptions: PlayIcon,
  
  // Savings
  Savings: BanknotesIcon,
  Investment: ChartBarIcon,
  'Emergency Fund': ShieldExclamationIcon,
  Retirement: TrophyIcon,
  
  // Other
  Other: EllipsisHorizontalIcon
};

// Income category icons
export const INCOME_CATEGORY_ICONS: Record<string, any> = {
  Salary: CurrencyDollarIcon,
  Freelance: BriefcaseIcon,
  Business: BuildingOfficeIcon,
  Investment: ChartBarIcon,
  Rental: HomeIcon,
  Bonus: TrophyIcon,
  Gift: GiftIcon,
  Other: EllipsisHorizontalIcon
};

// Get icon for a category
export function getCategoryIcon(category: string, type: 'income' | 'expense' = 'expense') {
  const icons = type === 'income' ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS;
  return icons[category] || EllipsisHorizontalIcon;
}

// Category colors for consistency
export const CATEGORY_COLORS: Record<string, string> = {
  // Needs - Blue/Indigo shades
  Groceries: 'text-blue-600 bg-blue-100',
  Rent: 'text-indigo-600 bg-indigo-100',
  Transport: 'text-blue-700 bg-blue-100',
  Utilities: 'text-indigo-700 bg-indigo-100',
  Insurance: 'text-blue-800 bg-blue-100',
  Healthcare: 'text-indigo-800 bg-indigo-100',
  Bills: 'text-blue-900 bg-blue-100',
  
  // Wants - Orange/Red shades
  Shopping: 'text-orange-600 bg-orange-100',
  Entertainment: 'text-red-600 bg-red-100',
  Dining: 'text-orange-700 bg-orange-100',
  Hobbies: 'text-pink-600 bg-pink-100',
  Travel: 'text-red-700 bg-red-100',
  Subscriptions: 'text-orange-800 bg-orange-100',
  
  // Savings - Green shades
  Savings: 'text-green-600 bg-green-100',
  Investment: 'text-emerald-600 bg-emerald-100',
  'Emergency Fund': 'text-green-700 bg-green-100',
  Retirement: 'text-emerald-700 bg-emerald-100',
  
  // Income - Purple shades
  Salary: 'text-purple-600 bg-purple-100',
  Freelance: 'text-violet-600 bg-violet-100',
  Business: 'text-purple-700 bg-purple-100',
  Rental: 'text-violet-700 bg-violet-100',
  Bonus: 'text-purple-800 bg-purple-100',
  Gift: 'text-pink-600 bg-pink-100',
  
  // Other
  Other: 'text-gray-600 bg-gray-100'
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'text-gray-600 bg-gray-100';
}