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

interface DonutChartProps {
  expenses: Expense[];
  currency: Currency;
}

export default function DonutChart({ expenses, currency }: DonutChartProps) {
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

  const colors = [
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600', 
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600'
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <h3 className="text-xl font-bold text-white">Category Breakdown</h3>
        <p className="text-white/80 text-sm">Donut visualization</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Donut Visualization - Simple representation */}
          <div className="relative w-48 h-48 mx-auto">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center relative">
              {/* Center content */}
              <div className="absolute inset-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-gray-900">{formatCurrency(total, currency)}</span>
                <span className="text-xs text-gray-600">Total</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {sortedCategories.map(([category, amount], index) => {
              const percentage = (amount / total) * 100;
              const Icon = getCategoryIcon(category, 'expense');
              
              return (
                <div key={category} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors[index]}`}></div>
                  <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatCurrency(amount, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}