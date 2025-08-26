'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { getCurrencySymbol, type Currency } from '@/lib/currency';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SpendingPieChartProps {
  expenses: {
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }[];
  currency?: Currency;
}

// Define distinct colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  // Needs
  Groceries: '#EF4444', // red-500
  Rent: '#3B82F6', // blue-500
  Transport: '#6366F1', // indigo-500
  Utilities: '#8B5CF6', // violet-500
  Insurance: '#A855F7', // purple-500
  Healthcare: '#EC4899', // pink-500
  
  // Wants
  Shopping: '#F59E0B', // amber-500
  Entertainment: '#F97316', // orange-500
  Dining: '#FB923C', // orange-400
  Hobbies: '#06B6D4', // cyan-500
  Travel: '#14B8A6', // teal-500
  Subscriptions: '#84CC16', // lime-500
  
  // Savings
  Savings: '#22C55E', // green-500
  Investment: '#059669', // emerald-600
  'Emergency Fund': '#16A34A', // green-600
  
  // Other
  Other: '#6B7280', // gray-500
  
  // Income categories (not shown in spending)
  Salary: '#10B981',
  Freelance: '#3B82F6',
  Business: '#8B5CF6',
  Rental: '#F59E0B',
  Bonus: '#22C55E',
  Gift: '#EC4899'
};

export default function SpendingPieChart({ expenses, currency = 'USD' }: SpendingPieChartProps) {
  const currencySymbol = getCurrencySymbol(currency);
  
  // Separate income and expenses
  const incomeTotal = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  // Group expenses by category (only expenses, not income)
  const categoryTotals = expenses
    .filter(e => e.type === 'expense')
    .reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

  // Sort categories by amount for better visualization
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Show top 10 expense categories

  const data: ChartData<'pie'> = {
    labels: sortedCategories.map(([category]) => category),
    datasets: [{
      data: sortedCategories.map(([, amount]) => amount),
      backgroundColor: sortedCategories.map(([category]) => 
        CATEGORY_COLORS[category] || '#9CA3AF'
      ),
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff'
    }]
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (!data.labels || !data.datasets.length) return [];
            
            const dataset = data.datasets[0];
            const total = (dataset.data as number[]).reduce((sum, value) => sum + value, 0);
            
            return data.labels.map((label, i) => {
              const value = dataset.data[i] as number;
              const percentage = ((value / total) * 100).toFixed(1);
              
              return {
                text: `${label}: ${currencySymbol}${value.toFixed(0)} (${percentage}%)`,
                fillStyle: dataset.backgroundColor ? 
                  (Array.isArray(dataset.backgroundColor) ? 
                    dataset.backgroundColor[i] : dataset.backgroundColor) : '#000',
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum: any, val: any) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${currencySymbol}${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Don't render if no expenses
  if (sortedCategories.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Distribution</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No expenses to display</p>
        </div>
      </div>
    );
  }

  const totalExpenses = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Expense Distribution</h3>
        <div className="flex gap-4 text-sm">
          {incomeTotal > 0 && (
            <p className="text-green-600 font-medium">Income: {currencySymbol}{incomeTotal.toFixed(2)}</p>
          )}
          <p className="text-red-600 font-medium">Expenses: {currencySymbol}{totalExpenses.toFixed(2)}</p>
          {incomeTotal > 0 && (
            <p className="text-gray-600 font-medium">Net: {currencySymbol}{(incomeTotal - totalExpenses).toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="h-80">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}