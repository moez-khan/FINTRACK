'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency, type Currency } from '@/lib/currency';

interface SpendingPieChartProps {
  expenses: {
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }[];
  currency?: Currency;
}

// Define distinct colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  // Needs
  Groceries: 'hsl(var(--chart-1))', // red-500
  Rent: 'hsl(var(--chart-2))', // blue-500
  Transport: 'hsl(var(--chart-3))', // indigo-500
  Utilities: 'hsl(var(--chart-4))', // violet-500
  Insurance: 'hsl(var(--chart-5))', // purple-500
  Healthcare: '#EC4899', // pink-500
  
  // Wants
  Shopping: '#F59E0B', // amber-500
  Entertainment: '#F97316', // orange-500
  Dining: '#FB923C', // orange-400
  Hobbies: '#06B6D4', // cyan-500
  Travel: '#14B8A6', // teal-500
  Subscriptions: '#84CC16', // lime-500
  
  // Savings
  Savings: '#22C55E', // green-500
  Investment: '#059669', // emerald-600
  'Emergency Fund': '#16A34A', // green-600
  
  // Other
  Other: '#6B7280', // gray-500
  Salary: '#10B981', // emerald-500
  Freelance: '#8B5CF6', // violet-500
  Business: '#3B82F6', // blue-500
  Rental: '#F59E0B', // amber-500
  Bonus: '#06B6D4', // cyan-500
  Gift: '#EC4899', // pink-500
};

export default function SpendingPieChartNew({ expenses, currency = 'USD' }: SpendingPieChartProps) {
  // Function to shorten long category names
  const shortenCategory = (name: string): string => {
    const shortened: Record<string, string> = {
      'Entertainment': 'Entertain.',
      'Subscriptions': 'Subscribe.',
      'Emergency Fund': 'Emergency',
      'Investment': 'Invest.',
      'Healthcare': 'Health',
      'Transport': 'Transport',
      'Insurance': 'Insurance',
      'Groceries': 'Groceries',
      'Utilities': 'Utilities',
      'Shopping': 'Shopping'
    };
    return shortened[name] || name;
  };
  // Separate income and expenses
  const incomeTotal = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  // Group expenses by category (only expenses, not income)
  const categoryTotals = expenses
    .filter(e => e.type === 'expense')
    .reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

  // Sort categories by amount for better visualization
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Show top 10 expense categories

  const data = sortedCategories.map(([category, amount]) => ({
    name: category,
    value: amount,
    fill: CATEGORY_COLORS[category] || '#9CA3AF'
  }));

  const totalExpenses = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);
  const netAmount = incomeTotal - totalExpenses;

  // Don't render if no expenses
  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Distribution</CardTitle>
          <CardDescription>Breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No expenses to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = sortedCategories.reduce((acc, [category]) => {
    acc[category] = {
      label: category,
      color: CATEGORY_COLORS[category] || '#9CA3AF'
    };
    return acc;
  }, {} as any);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Category
              </span>
              <span className="font-bold text-muted-foreground">
                {data.name}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Amount
              </span>
              <span className="font-bold">
                {formatCurrency(data.value, currency)} ({percentage}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Distribution</CardTitle>
        <CardDescription>
          Top spending categories for the period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Income</p>
            <p className="text-sm sm:text-lg font-bold text-green-600">
              {formatCurrency(incomeTotal, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Expenses</p>
            <p className="text-sm sm:text-lg font-bold text-red-600">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Net</p>
            <p className={`text-sm sm:text-lg font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netAmount < 0 && '-'}{formatCurrency(Math.abs(netAmount), currency)}
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => {
                if (!entry.value) return '';
                const percent = ((entry.value / totalExpenses) * 100).toFixed(0);
                return Number(percent) > 5 ? `${percent}%` : '';
              }}
              outerRadius="65%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom Legend for better mobile display */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs">
          {sortedCategories.slice(0, 6).map(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            const displayName = shortenCategory(category);
            return (
              <div key={category} className="flex items-center gap-1.5 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: CATEGORY_COLORS[category] || '#9CA3AF' }}
                />
                <span className="text-muted-foreground whitespace-nowrap">
                  {displayName}: {percentage}%
                </span>
              </div>
            );
          })}
          {sortedCategories.length > 6 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>+{sortedCategories.length - 6} more</span>
            </div>
          )}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}