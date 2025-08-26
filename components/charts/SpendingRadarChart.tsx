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

interface SpendingRadarChartProps {
  expenses: Expense[];
  currency: Currency;
}

export default function SpendingRadarChart({ expenses, currency }: SpendingRadarChartProps) {
  const categoryData = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  if (topCategories.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
          <h3 className="text-xl font-bold text-white">Spending Radar</h3>
          <p className="text-white/80 text-sm">Multi-category comparison</p>
        </div>
        <div className="p-6 text-center text-gray-500">
          No spending data available
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...topCategories.map(([, amount]) => amount));

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
        <h3 className="text-xl font-bold text-white">Spending Radar</h3>
        <p className="text-white/80 text-sm">Multi-category comparison</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center">
          {/* Simplified radar visualization */}
          <div className="relative w-64 h-64 mb-6">
            <div className="absolute inset-0 border-2 border-purple-200 rounded-full"></div>
            <div className="absolute inset-4 border border-purple-100 rounded-full"></div>
            <div className="absolute inset-8 border border-purple-100 rounded-full"></div>
            <div className="absolute inset-12 border border-purple-100 rounded-full"></div>
            
            {/* Category spokes */}
            {topCategories.map((_, index) => {
              const angle = (index * 2 * Math.PI) / topCategories.length - Math.PI / 2;
              
              return (
                <div
                  key={index}
                  className="absolute w-0.5 bg-purple-200 origin-bottom"
                  style={{
                    height: '112px',
                    left: '50%',
                    bottom: '50%',
                    transform: `translateX(-50%) rotate(${(angle * 180 / Math.PI) + 90}deg)`
                  }}
                />
              );
            })}
          </div>
          
          {/* Category breakdown */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {topCategories.map(([category, amount]) => {
              const Icon = getCategoryIcon(category, 'expense');
              const percentage = (amount / maxAmount) * 100;
              
              return (
                <div key={category} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{category}</p>
                    <p className="text-xs text-gray-600">{formatCurrency(amount, currency)}</p>
                    <div className="w-full bg-purple-100 rounded-full h-1 mt-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
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