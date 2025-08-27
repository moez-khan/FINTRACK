'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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

interface DonutChartProps {
  expenses: Expense[];
  currency: Currency;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8B5CF6',
];

export default function DonutChartNew({ expenses, currency }: DonutChartProps) {
  const categoryData = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(categoryData).reduce((sum, value) => sum + value, 0);
  const sortedCategories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const data = sortedCategories.map(([category, amount], index) => ({
    name: category,
    value: amount,
    fill: COLORS[index % COLORS.length]
  }));

  const chartConfig = sortedCategories.reduce((acc, [category], index) => {
    acc[category] = {
      label: category,
      color: COLORS[index % COLORS.length]
    };
    return acc;
  }, {} as any);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
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
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>Donut visualization of spending</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-center mb-4 w-full">
          <p className="text-xl sm:text-2xl font-bold">{formatCurrency(total, currency)}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
        </div>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full mx-auto">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius="40%"
              outerRadius="60%"
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
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm w-full max-w-md">
          {sortedCategories.map(([category, amount], index) => (
            <div key={category} className="flex items-center gap-1.5 min-w-0">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate">{category}</span>
              <span className="text-muted-foreground ml-auto flex-shrink-0">
                {((amount / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}