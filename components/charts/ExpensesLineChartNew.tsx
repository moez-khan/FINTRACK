'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDate } from '@/lib/dateUtils';
import { formatCurrency, type Currency } from '@/lib/currency';

interface ExpensesLineChartProps {
  expenses: {
    amount: number;
    type: 'income' | 'expense';
    date: string;
  }[];
  period?: 'week' | 'month' | 'year';
  currency?: Currency;
}

export default function ExpensesLineChartNew({ expenses, period = 'month', currency = 'USD' }: ExpensesLineChartProps) {
  // Group expenses by time period
  const groupByPeriod = () => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    
    expenses.forEach((transaction) => {
      const date = new Date(transaction.date);
      let key: string;
      
      switch (period) {
        case 'week':
          // Group by week
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = formatDate(weekStart.toISOString());
          break;
        case 'year':
          // Group by month for yearly view
          key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        default:
          // Group by day for monthly view
          key = formatDate(transaction.date);
      }
      
      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        grouped[key].income += transaction.amount;
      } else {
        grouped[key].expense += transaction.amount;
      }
    });
    
    return grouped;
  };

  const groupedData = groupByPeriod();
  
  // Convert to array and sort by date
  const chartData = Object.entries(groupedData)
    .map(([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expense,
      net: data.income - data.expense
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Show last 30 data points

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-2))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-1))",
    },
    net: {
      label: "Net",
      color: "hsl(var(--chart-3))",
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Date
              </span>
              <span className="font-bold text-muted-foreground">
                {label}
              </span>
            </div>
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  {entry.name}
                </span>
                <span className="font-bold" style={{ color: entry.color }}>
                  {formatCurrency(entry.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get period label for the card title
  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Weekly';
      case 'year':
        return 'Yearly';
      default:
        return 'Monthly';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Trends</CardTitle>
        <CardDescription>
          {getPeriodLabel()} income vs expenses analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${formatCurrency(value, currency, true)}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="income"
              stroke="hsl(var(--chart-2))"
              activeDot={{
                r: 6,
                style: { fill: "hsl(var(--chart-2))", opacity: 0.8 },
              }}
            />
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="expenses"
              stroke="hsl(var(--chart-1))"
              activeDot={{
                r: 6,
                style: { fill: "hsl(var(--chart-1))", opacity: 0.8 },
              }}
            />
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="net"
              stroke="hsl(var(--chart-3))"
              strokeDasharray="5 5"
              activeDot={{
                r: 6,
                style: { fill: "hsl(var(--chart-3))", opacity: 0.8 },
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}