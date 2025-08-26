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

export default function CalendarHeatmap({ expenses, currency }: CalendarHeatmapProps) {
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

  const maxDaily = Math.max(...Object.values(dailyData), 1);
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  const getIntensity = (amount: number) => {
    if (amount === 0) return 'bg-gray-100';
    const intensity = amount / maxDaily;
    if (intensity > 0.75) return 'bg-red-500';
    if (intensity > 0.5) return 'bg-red-400';
    if (intensity > 0.25) return 'bg-red-300';
    return 'bg-red-200';
  };

  const generateCalendarDays = () => {
    const days = [];
    const current = new Date(startDate);
    const endDate = new Date(today);
    
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const amount = dailyData[dateKey] || 0;
      days.push({
        date: new Date(current),
        dateKey,
        amount,
        intensity: getIntensity(amount)
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  let currentWeek: typeof calendarDays = [];

  calendarDays.forEach((day, index) => {
    if (currentWeek.length === 0) {
      // Pad start of first week if needed
      while (currentWeek.length < day.date.getDay()) {
        currentWeek.push(null as any);
      }
    }
    
    currentWeek.push(day);
    
    if (day.date.getDay() === 6 || index === calendarDays.length - 1) {
      // Pad end of last week if needed
      while (currentWeek.length < 7) {
        currentWeek.push(null as any);
      }
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
        <h3 className="text-xl font-bold text-white">Daily Spending Heatmap</h3>
        <p className="text-white/80 text-sm">Last 3 months activity</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={day ? day.dateKey : `empty-${weekIndex}-${dayIndex}`}
                  className={`h-6 rounded ${day ? day.intensity : 'bg-transparent'} ${day ? 'cursor-pointer transition-all hover:scale-110' : ''}`}
                  title={day ? `${day.date.toLocaleDateString()}: ${formatCurrency(day.amount, currency)}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <div className="w-3 h-3 bg-red-300 rounded"></div>
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <div className="w-3 h-3 bg-red-500 rounded"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}