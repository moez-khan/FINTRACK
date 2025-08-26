'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CalendarHeatmapProps {
  expenses: Expense[];
  currency: Currency;
}

export default function CalendarHeatmapNew({ expenses, currency }: CalendarHeatmapProps) {
  const dailyData = expenses.reduce((acc, expense) => {
    const dateKey = expense.date instanceof Date 
      ? expense.date.toISOString().split('T')[0]
      : expense.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Get the last 3 months of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  // Create array of weeks
  const weeks: { date: Date; amount: number }[][] = [];
  let currentWeek: { date: Date; amount: number }[] = [];
  
  const currentDate = new Date(startDate);
  // Start from the beginning of the week
  currentDate.setDate(currentDate.getDate() - currentDate.getDay());

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    currentWeek.push({
      date: new Date(currentDate),
      amount: dailyData[dateStr] || 0
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const maxAmount = Math.max(...Object.values(dailyData), 1);

  const getColor = (amount: number) => {
    if (amount === 0) return 'bg-muted';
    const intensity = amount / maxAmount;
    if (intensity < 0.25) return 'bg-emerald-200';
    if (intensity < 0.5) return 'bg-emerald-400';
    if (intensity < 0.75) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity Heatmap</CardTitle>
        <CardDescription>Spending patterns over the last 3 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day labels */}
            <div className="flex gap-1 mb-2">
              <div className="w-12"></div>
              {days.map((day, i) => (
                <div key={i} className="w-4 text-xs text-muted-foreground text-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="flex gap-1">
              <div className="flex flex-col justify-between pr-2">
                {Array.from({ length: 3 }, (_, i) => {
                  const month = new Date();
                  month.setMonth(month.getMonth() - (2 - i));
                  return (
                    <div key={i} className="text-xs text-muted-foreground">
                      {months[month.getMonth()]}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => {
                      const dateStr = day.date.toISOString().split('T')[0];
                      const isInRange = day.date >= startDate && day.date <= endDate;
                      return (
                        <div
                          key={dayIndex}
                          className={`w-4 h-4 rounded-sm transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-primary ${
                            isInRange ? getColor(day.amount) : 'bg-transparent'
                          }`}
                          title={isInRange ? `${dateStr}: ${formatCurrency(day.amount, currency)}` : ''}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <div className="w-4 h-4 rounded-sm bg-emerald-200" />
                <div className="w-4 h-4 rounded-sm bg-emerald-400" />
                <div className="w-4 h-4 rounded-sm bg-emerald-500" />
                <div className="w-4 h-4 rounded-sm bg-emerald-600" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}