import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';
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

export default function ExpenseScatterPlot({ expenses, currency }: ExpenseScatterPlotProps) {
  const categoryFrequency = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0, amounts: [] };
    }
    acc[expense.category].total += expense.amount;
    acc[expense.category].count += 1;
    acc[expense.category].amounts.push(expense.amount);
    return acc;
  }, {} as Record<string, { total: number, count: number, amounts: number[] }>);

  const scatterData = Object.entries(categoryFrequency).map(([category, data]) => ({
    category,
    averageAmount: data.total / data.count,
    frequency: data.count,
    total: data.total
  }));

  if (scatterData.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6">
          <h3 className="text-xl font-bold text-white">Expense Scatter Plot</h3>
          <p className="text-white/80 text-sm">Average amount vs frequency</p>
        </div>
        <div className="p-6 text-center text-gray-500">
          No expense data available
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...scatterData.map(d => d.averageAmount));
  const maxFrequency = Math.max(...scatterData.map(d => d.frequency));

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6">
        <h3 className="text-xl font-bold text-white">Expense Scatter Plot</h3>
        <p className="text-white/80 text-sm">Average amount vs frequency</p>
      </div>
      <div className="p-6">
        <div className="h-64 relative bg-gray-50 rounded-lg p-4 mb-4">
          {/* Grid background */}
          <div className="absolute inset-4 grid grid-cols-4 grid-rows-4 gap-0">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-gray-200"></div>
            ))}
          </div>
          
          {/* Data points */}
          <div className="relative h-full">
            {scatterData.map(({ category, averageAmount, frequency, total }) => {
              const x = (frequency / maxFrequency) * 85 + 5;
              const y = 85 - (averageAmount / maxAmount) * 75;
              const size = Math.max(8, Math.min(24, (total / Math.max(...scatterData.map(d => d.total))) * 20));
              const Icon = getCategoryIcon(category, 'expense');
              
              return (
                <div
                  key={category}
                  className="absolute flex items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`
                  }}
                  title={`${category}: ${frequency} transactions, Avg: ${formatCurrency(averageAmount, currency)}`}
                >
                  <Icon className="w-3 h-3" />
                </div>
              );
            })}
          </div>
          
          {/* Axes labels */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
            Frequency →
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600">
            Avg Amount →
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Bubble size:</strong> Total spending in category</p>
          <p><strong>Position:</strong> X = frequency, Y = average amount</p>
        </div>
        
        {/* Category summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {scatterData.slice(0, 6).map(({ category, averageAmount, frequency, total }) => {
            const Icon = getCategoryIcon(category, 'expense');
            return (
              <div key={category} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900">{category}</p>
                  <p className="text-gray-600">
                    {frequency} transactions • Avg: {formatCurrency(averageAmount, currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}