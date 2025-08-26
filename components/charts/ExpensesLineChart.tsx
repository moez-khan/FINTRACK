'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { formatDate } from '@/lib/dateUtils';
import { getCurrencySymbol, type Currency } from '@/lib/currency';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExpensesLineChartProps {
  expenses: {
    amount: number;
    type: 'income' | 'expense';
    date: string;
  }[];
  period?: 'week' | 'month' | 'year';
  currency?: Currency;
}

export default function ExpensesLineChart({ expenses, period = 'month', currency = 'USD' }: ExpensesLineChartProps) {
  const currencySymbol = getCurrencySymbol(currency);
  // Group expenses by time period
  const groupByPeriod = () => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    
    expenses.forEach((transaction) => {
      const date = new Date(transaction.date);
      let key: string;
      
      if (period === 'week') {
        // Group by week (Sunday-Saturday)
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = formatDate(startOfWeek);
      } else if (period === 'month') {
        // Group by month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      } else {
        // Group by year
        key = date.getFullYear().toString();
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
  
  // Sort keys chronologically
  const sortedKeys = Object.keys(groupedData).sort((a, b) => {
    if (period === 'month') {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    }
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Take last 12 periods for better visualization
  const displayKeys = sortedKeys.slice(-12);
  
  const data: ChartData<'line'> = {
    labels: displayKeys,
    datasets: [
      {
        label: 'Income',
        data: displayKeys.map(key => groupedData[key]?.income || 0),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      },
      {
        label: 'Expenses',
        data: displayKeys.map(key => groupedData[key]?.expense || 0),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      },
      {
        label: 'Net',
        data: displayKeys.map(key => {
          const data = groupedData[key];
          return data ? data.income - data.expense : 0;
        }),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        borderDash: [10, 5],
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${currencySymbol}${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return currencySymbol + value.toLocaleString();
          }
        }
      }
    }
  };
  
  // Don't render if no data
  if (displayKeys.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Income vs Expenses</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No transaction data to display</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Financial Heartbeat</h3>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs rounded-lg ${
              period === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {/* Add period change handler */}}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-lg ${
              period === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {/* Add period change handler */}}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-lg ${
              period === 'year' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {/* Add period change handler */}}
          >
            Year
          </button>
        </div>
      </div>
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}