'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { formatCurrency, type Currency } from '@/lib/currency';

interface Expense {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SpendingRadarChartProps {
  expenses: Expense[];
  currency: Currency;
}

export default function SpendingRadarChartNew({ expenses, currency }: SpendingRadarChartProps) {
  // Shorten category names for mobile
  const shortenCategory = (name: string): string => {
    const maxLength = 10;
    if (name.length <= maxLength) return name;
    
    const shortened: Record<string, string> = {
      'Entertainment': 'Entertain.',
      'Transportation': 'Transport',
      'Subscriptions': 'Subscribe.',
      'Healthcare': 'Health',
      'Personal Care': 'Personal',
      'Home & Garden': 'Home',
      'Gifts & Donations': 'Gifts',
    };
    
    return shortened[name] || (name.length > maxLength ? name.substring(0, maxLength - 1) + '.' : name);
  };

  // Group by category and get top 6
  const categoryData = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const maxAmount = Math.max(...sortedCategories.map(([,amount]) => amount));

  const data = sortedCategories.map(([category, amount]) => ({
    category: shortenCategory(category),
    fullCategory: category,
    amount,
    fullMark: maxAmount,
  }));

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-4))",
    },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Category
              </span>
              <span className="font-bold text-muted-foreground">
                {data.payload.fullCategory || data.payload.category}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Amount
              </span>
              <span className="font-bold">
                {formatCurrency(data.value, currency)}
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
        <CardTitle>Spending Radar</CardTitle>
        <CardDescription>Multi-category spending comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid 
              gridType="polygon"
              className="stroke-muted"
            />
            <PolarAngleAxis 
              dataKey="category"
              className="text-[10px] sm:text-xs"
              tick={{ fontSize: 10 }}
            />
            <PolarRadiusAxis 
              angle={90}
              domain={[0, maxAmount]}
              className="text-[10px] sm:text-xs"
              tick={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar 
              name="Amount" 
              dataKey="amount" 
              stroke="hsl(var(--chart-4))" 
              fill="hsl(var(--chart-4))" 
              fillOpacity={0.6}
            />
          </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedCategories.map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground truncate mr-2">{shortenCategory(category)}</span>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {formatCurrency(amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}