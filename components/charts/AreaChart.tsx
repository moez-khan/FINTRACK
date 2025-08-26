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

interface AreaChartProps {
  expenses: Expense[];
  currency: Currency;
}

export default function AreaChart({ expenses, currency }: AreaChartProps) {
  const monthlyData = expenses.reduce((acc, expense) => {
    const date = expense.date instanceof Date ? expense.date : new Date(expense.date);
    const monthKey = date.toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  const maxAmount = Math.max(...sortedMonths.map(([, amount]) => amount), 1);

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
        <h3 className="text-xl font-bold text-white">Area Chart</h3>
        <p className="text-white/80 text-sm">Filled trend visualization</p>
      </div>
      <div className="p-6">
        <div className="h-64 relative bg-gradient-to-b from-green-50 to-transparent rounded-lg p-4">
          {sortedMonths.map(([month, amount], index) => {
            const height = (amount / maxAmount) * 200;
            const width = 100 / sortedMonths.length;
            
            return (
              <div
                key={month}
                className="absolute bottom-4 bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg opacity-70 hover:opacity-90 transition-opacity"
                style={{
                  left: `${index * width + 2}%`,
                  width: `${width - 4}%`,
                  height: `${height}px`
                }}
                title={`${new Date(month + '-01').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}: ${formatCurrency(amount, currency)}`}
              />
            );
          })}
        </div>
        
        {/* Month Labels */}
        <div className="grid gap-2 mt-4 text-xs text-gray-600" style={{ gridTemplateColumns: `repeat(${sortedMonths.length}, 1fr)` }}>
          {sortedMonths.map(([month, amount]) => (
            <div key={month} className="text-center">
              <div className="font-medium">
                {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
              </div>
              <div className="text-gray-500">
                {formatCurrency(amount, currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}