'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

interface ExpenseScatterPlotProps {
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
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#6B7280'
];

export default function ExpenseScatterPlotNew({ expenses, currency }: ExpenseScatterPlotProps) {
  // Group by category
  const categoryStats = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {
        totalAmount: 0,
        count: 0,
        amounts: []
      };
    }
    acc[expense.category].totalAmount += expense.amount;
    acc[expense.category].count++;
    acc[expense.category].amounts.push(expense.amount);
    return acc;
  }, {} as Record<string, { totalAmount: number; count: number; amounts: number[] }>);

  const data = Object.entries(categoryStats).map(([category, stats], index) => ({
    category,
    x: stats.count,
    y: stats.totalAmount / stats.count, // Average amount
    z: stats.totalAmount, // Total for bubble size
    color: COLORS[index % COLORS.length]
  }));

  const chartConfig = {
    scatter: {
      label: "Categories",
      color: "hsl(var(--chart-1))",
    },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Category
              </span>
              <span className="font-bold">
                {data.category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Frequency
                </span>
                <span className="font-bold">
                  {data.x} transactions
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Avg Amount
                </span>
                <span className="font-bold">
                  {formatCurrency(data.y, currency)}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Total Spent
              </span>
              <span className="font-bold">
                {formatCurrency(data.z, currency)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const maxTotal = Math.max(...data.map(d => d.z));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Patterns</CardTitle>
        <CardDescription>Frequency vs Average Amount by Category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 10,
              right: 10,
              bottom: 50,
              left: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Frequency"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Frequency', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Average"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, currency, true)}
              label={{ value: 'Avg', angle: -90, position: 'insideLeft', offset: -15, style: { textAnchor: 'middle' }, fontSize: 10 }}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Categories" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.slice(0, 6).map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs sm:text-sm truncate">{item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category}</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-auto whitespace-nowrap">
                {item.x} times
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}