'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, BarChart } from 'recharts';
import { formatCurrency, type Currency } from '@/lib/currency';
import { formatPeriodLabel } from '@/lib/periodUtils';

interface PeriodData {
  id: string;
  periodType: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  budgetAdherence?: number;
  savingsRate?: number;
}

interface PeriodAnalyticsProps {
  currency: Currency;
}

export default function PeriodAnalytics({ currency }: PeriodAnalyticsProps) {
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'comparison' | 'trends' | 'performance'>('comparison');

  useEffect(() => {
    fetchPeriodData();
  }, []);

  const fetchPeriodData = async () => {
    try {
      const response = await fetch('/api/rule-period');
      const data = await response.json();
      setPeriods(data.historicalPeriods || []);
    } catch (error) {
      console.error('Error fetching period data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Period Analytics</h3>
        <p className="text-gray-600">No historical period data available yet. Complete your first period to see analytics.</p>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = periods.slice(-6).map(period => ({
    label: formatPeriodLabel(
      period.periodType as any,
      new Date(period.startDate),
      new Date(period.endDate)
    ),
    income: period.totalIncome,
    expenses: period.totalExpenses,
    savings: period.totalSavings,
    savingsRate: period.savingsRate || 0,
    netIncome: period.totalIncome - period.totalExpenses
  }));

  const renderComparison = () => (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses Comparison</CardTitle>
        <CardDescription>Track your financial flow across periods</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            income: { label: "Income", color: "hsl(var(--chart-2))" },
            expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
            savings: { label: "Savings", color: "hsl(var(--chart-3))" }
          }} 
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label"
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
              <Bar dataKey="savings" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );

  const renderTrends = () => (
    <Card>
      <CardHeader>
        <CardTitle>Savings Rate Trend</CardTitle>
        <CardDescription>Your savings percentage over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            savingsRate: { label: "Savings Rate (%)", color: "hsl(var(--chart-4))" }
          }} 
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label"
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
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: any) => `${value.toFixed(1)}%`}
              />
              <Line 
                type="monotone" 
                dataKey="savingsRate" 
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );

  const renderPerformance = () => {
    const avgSavingsRate = chartData.reduce((sum, d) => sum + d.savingsRate, 0) / chartData.length;
    const totalSaved = chartData.reduce((sum, d) => sum + d.savings, 0);
    const bestPeriod = chartData.reduce((best, curr) => 
      curr.savingsRate > best.savingsRate ? curr : best
    );
    const worstPeriod = chartData.reduce((worst, curr) => 
      curr.savingsRate < worst.savingsRate ? curr : worst
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Savings Rate</p>
              <p className="text-2xl font-bold">{avgSavingsRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSaved, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Period</p>
              <p className="font-semibold">{bestPeriod.label}</p>
              <p className="text-sm text-green-600">{bestPeriod.savingsRate.toFixed(1)}% saved</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Improvement</p>
              <p className="font-semibold">{worstPeriod.label}</p>
              <p className="text-sm text-orange-600">{worstPeriod.savingsRate.toFixed(1)}% saved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Income Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={{
                netIncome: { label: "Net Income", color: "hsl(var(--chart-5))" }
              }} 
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value, currency, true)}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value, currency)}
                  />
                  <Bar 
                    dataKey="netIncome" 
                    fill="hsl(var(--chart-5))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
        <h3 className="text-xl font-bold text-white">Period Analytics</h3>
        <p className="text-white/80 text-sm mt-1">Historical performance across your financial periods</p>
      </div>
      
      <div className="p-6">
        {/* View Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedView('comparison')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'comparison'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'trends'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setSelectedView('performance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'performance'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Performance
          </button>
        </div>

        {/* Chart Display */}
        {selectedView === 'comparison' && renderComparison()}
        {selectedView === 'trends' && renderTrends()}
        {selectedView === 'performance' && renderPerformance()}
      </div>
    </div>
  );
}