'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { formatCurrency, type Currency } from '@/lib/currency';
import { getCategoryIcon } from '@/lib/categoryIcons';

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

interface CategoryBarChartProps {
  expenses: Expense[];
  currency: Currency;
}

export default function CategoryBarChartNew({ expenses, currency }: CategoryBarChartProps) {
  // Process data - group by category and sum amounts
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Math.abs(expense.amount); // Use absolute value to handle negative numbers
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryData)
    .filter(([_, amount]) => amount > 0) // Filter out zero amounts
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // If no data, show empty state
  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>Spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = sortedCategories.map(([category, amount]) => ({
    category: category.length > 15 ? category.substring(0, 15) + '...' : category,
    fullCategory: category,
    amount: Number(amount.toFixed(2)),
  }));

  const maxAmount = Math.max(...sortedCategories.map(([,amount]) => amount));

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-1))",
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
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>Spending by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{
                top: 5,
                right: 30,
                left: 100,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, maxAmount * 1.1]}
                tickFormatter={(value) => formatCurrency(value, currency, true)}
              />
              <YAxis 
                dataKey="category"
                type="category"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={95}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--chart-1))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Income vs Expenses Comparison Component
export function IncomeExpenseComparisonNew({ expenses, currency }: { expenses: Expense[], currency: Currency }) {
  const monthlyData = expenses.reduce((acc, expense) => {
    const monthKey = new Date(expense.date).toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expenses: 0 };
    }
    if (expense.type === 'income') {
      acc[monthKey].income += expense.amount;
    } else {
      acc[monthKey].expenses += expense.amount;
    }
    return acc;
  }, {} as Record<string, { income: number, expenses: number }>);

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      }),
      income: data.income,
      expenses: data.expenses,
    }));

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-2))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Monthly comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, currency, true)}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value, currency)}
            />
            <Legend />
            <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Monthly Trend Chart
export function MonthlyTrendChartNew({ expenses, currency }: { expenses: Expense[], currency: Currency }) {
  // Only consider expenses for trend analysis, not income
  const monthlyTotals = expenses
    .filter(e => e.type === 'expense')
    .reduce((acc, expense) => {
    const monthKey = new Date(expense.date).toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const chartData = sortedMonths.map(([month, amount]) => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    }),
    amount
  }));

  const average = sortedMonths.reduce((sum, [, amount]) => sum + amount, 0) / sortedMonths.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expense Trends</CardTitle>
        <CardDescription>Last 12 months spending overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Monthly Average</p>
          <p className="text-2xl font-bold">{formatCurrency(average, currency)}</p>
        </div>
        <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--chart-3))" } }} className="h-[300px]">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, currency, true)}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value, currency)}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}