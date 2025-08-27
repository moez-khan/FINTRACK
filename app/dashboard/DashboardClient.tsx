'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '@/components/Navbar';
import EditTransactionModalOptimistic from '@/components/EditTransactionModalOptimistic';
import EditGoalModal from '@/components/EditGoalModal';
import ProfileSettings from '@/components/ProfileSettings';
import PeriodSelector from '@/components/PeriodSelector';
import PDFExportModal from '@/components/PDFExportModal';
import DateRangeSelectorModal from '@/components/DateRangeSelectorModal';
import PeriodAnalytics from '@/components/PeriodAnalytics';
import BillReminderManager from '@/components/BillReminderManager';
import SpendingPieChartNew from '@/components/charts/SpendingPieChartNew';
import ExpensesLineChartNew from '@/components/charts/ExpensesLineChartNew';
import ProgressBar, { CircularProgress } from '@/components/charts/ProgressBar';
import toast from 'react-hot-toast';
import ToastProvider from '@/components/ToastProvider';
import { 
  calculate50_30_20, 
  calculatePayYourselfFirst, 
  calculateSmartGoal
} from '@/lib/financeRules';
import {
  calculate50_30_20ForPeriod,
  calculatePayYourselfFirstForPeriod,
  filterExpensesByPeriod,
  calculatePeriodIncome
} from '@/lib/financeRulesWithPeriod';
import { formatDate } from '@/lib/dateUtils';
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

interface SavingGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  expenses: Expense[];
  savingGoals: SavingGoal[];
}

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    selectedRule?: string | null;
    savingsPercentage?: number;
    currency?: string;
    rulePeriod?: string;
    customPeriodDays?: number | null;
    periodStartDate?: string;
    autoResetEnabled?: boolean;
  };
  initialData: DashboardData;
}

export default function DashboardClient({ user: initialUser, initialData }: DashboardClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(initialData.savingGoals);
  const [, setLoading] = useState(false);
  const [chartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [deletedTransactions, setDeletedTransactions] = useState<Map<string, Expense>>(new Map());
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Expense | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  
  // Collapsible sections
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // PDF Export Modal state
  const [pdfExportModal, setPdfExportModal] = useState<{
    isOpen: boolean;
    status: 'generating' | 'success' | 'error';
    fileName?: string;
    error?: string;
  }>({ isOpen: false, status: 'generating' });
  
  // Date Range Selector state
  const [showDateRangeSelector, setShowDateRangeSelector] = useState(false);

  // Calculate financial metrics
  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  const monthlyIncome = totalIncome; // Use total income from the period

  // Get all transactions sorted by date
  const allTransactions = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate Professional PDF Report
  const generatePDFReport = async (startDate?: string, endDate?: string, periodLabel?: string) => {
    try {
      // Show generating modal
      setPdfExportModal({ isOpen: true, status: 'generating' });
      setShowDateRangeSelector(false);
      
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Validate expenses data
      if (!expenses || !Array.isArray(expenses)) {
        throw new Error('No transaction data available');
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Filter expenses based on date range
      let filteredExpenses = expenses;
      let dateRangeText = 'All Time';
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        
        filteredExpenses = expenses.filter(e => {
          const expDate = new Date(e.date);
          return expDate >= start && expDate <= end;
        });
        
        dateRangeText = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      
      // Calculate metrics for filtered period
      const filteredIncome = filteredExpenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
        
      const filteredExpensesTotal = filteredExpenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
        
      const filteredBalance = filteredIncome - filteredExpensesTotal;
      
      // Calculate spending insights for filtered data
      const categoryTotals = filteredExpenses
        .filter(e => e.type === 'expense')
        .reduce((acc, expense) => {
          const category = expense.category || 'Miscellaneous';
          acc[category] = (acc[category] || 0) + Math.abs(expense.amount);
          return acc;
        }, {} as Record<string, number>);
      
      const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
      
      const topCategory = sortedCategories[0];
      const spendingPercentage = topCategory ? ((topCategory[1] / filteredExpensesTotal) * 100).toFixed(1) : '0';
      
      // PROFESSIONAL HEADER DESIGN - Matching website gradient
      // Main header with gradient-like effect (using solid color)
      doc.setFillColor(99, 102, 241); // Indigo-500
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      // Accent stripe with purple
      doc.setFillColor(139, 92, 246); // Purple-500
      doc.rect(0, 57, pageWidth, 3, 'F');
      
      // Left side - Company/App info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL STATEMENT', 20, 22);
      
      // Report subtitle
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Personal Finance Analysis Report', 20, 32);
      
      // Right side - Report metadata
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Position right-aligned content properly
      const rightMargin = 20;
      const rightStartX = pageWidth - rightMargin;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT DATE', rightStartX, 18, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(reportDate, rightStartX, 25, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT PERIOD', rightStartX, 33, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateRangeText, rightStartX, 40, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCOUNT HOLDER', rightStartX, 48, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(user.name || user.email.split('@')[0], rightStartX, 55, { align: 'right' });
      
      // Reset colors
      doc.setTextColor(0, 0, 0);
      
      // PAGE 1 - EXECUTIVE DASHBOARD
      let currentY = 75;
      
      // Executive Summary Header with rounded corners
      doc.setFillColor(99, 102, 241);
      doc.rect(15, currentY, pageWidth - 30, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('EXECUTIVE FINANCIAL OVERVIEW', pageWidth / 2, currentY + 8, { align: 'center' });
      
      currentY += 20;
      
      // Key Metrics Cards - 4 column layout
      const cardWidth = 42;
      const cardHeight = 25;
      const cardSpacing = 5;
      const startX = 20;
      
      const metrics = [
        { label: 'Total Income', value: formatCurrency(filteredIncome, user.currency as Currency), color: [34, 197, 94], icon: '↗' },
        { label: 'Total Expenses', value: formatCurrency(Math.abs(filteredExpensesTotal), user.currency as Currency), color: [239, 68, 68], icon: '↘' },
        { label: 'Net Balance', value: formatCurrency(filteredBalance, user.currency as Currency), color: filteredBalance >= 0 ? [34, 197, 94] : [239, 68, 68], icon: filteredBalance >= 0 ? '↗' : '↘' },
        { label: 'Savings Rate', value: filteredBalance > 0 && filteredIncome > 0 ? `${((filteredBalance / filteredIncome) * 100).toFixed(1)}%` : '0%', color: [99, 102, 241], icon: '=' }
      ];
      
      metrics.forEach((metric, index) => {
        const x = startX + (index * (cardWidth + cardSpacing));
        
        // Card background
        doc.setFillColor(250, 250, 251);
        doc.rect(x, currentY, cardWidth, cardHeight, 'F');
        
        // Color accent bar
        const [r, g, b] = metric.color;
        doc.setFillColor(r, g, b);
        doc.rect(x, currentY, cardWidth, 3, 'F');
        
        // Metric label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(metric.label, x + cardWidth/2, currentY + 9, { align: 'center' });
        
        // Metric value
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(metric.value, x + cardWidth/2, currentY + 18, { align: 'center' });
        
        // Trend icon
        doc.setFontSize(10);
        doc.setTextColor(r, g, b);
        doc.text(metric.icon, x + cardWidth - 5, currentY + 22);
      });
      
      currentY += cardHeight + 15;
      
      // SPENDING ANALYSIS SECTION
      doc.setFillColor(99, 102, 241);
      doc.rect(15, currentY, pageWidth - 30, 10, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('SPENDING ANALYSIS & INSIGHTS', pageWidth / 2, currentY + 7, { align: 'center' });
      
      currentY += 18;
      
      // Create spending breakdown table
      const spendingData = sortedCategories.length > 0 
        ? sortedCategories.slice(0, 6).map(([category, amount]) => {
            const percentage = filteredExpensesTotal > 0 ? ((amount / filteredExpensesTotal) * 100).toFixed(1) : '0';
            const barWidth = filteredExpensesTotal > 0 ? Math.min(40, (amount / filteredExpensesTotal) * 40) : 0;
            return [category, formatCurrency(amount, user.currency as Currency), `${percentage}%`, barWidth];
          })
        : [['No expenses in period', formatCurrency(0, user.currency as Currency), '0%', 0]];
      
      // Spending table with visual bars
      if (spendingData.length > 0) {
        autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Amount', '% of Total', 'Visual Distribution']],
        body: spendingData.map(([cat, amt, pct]) => [cat, amt, pct, '']),
        theme: 'grid',
        headStyles: { 
          fillColor: [99, 102, 241],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 45, halign: 'right' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 45 }
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 20, right: 20 },
        didDrawCell: (data) => {
          // Draw visual bars in the last column
          if (data.column.index === 3 && data.cell.section === 'body' && data.row.index < spendingData.length) {
            const barWidth = spendingData[data.row.index][3] as number;
            if (barWidth > 0) {
              doc.setFillColor(99, 102, 241);
              doc.rect(data.cell.x + 2, data.cell.y + 3, barWidth, 6, 'F');
            }
          }
        }
      });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        currentY += 30; // Skip if no data
      }
      
      // FINANCIAL RULE COMPLIANCE
      const selectedRule = user.selectedRule || '50-30-20';
      doc.setFillColor(239, 246, 255);
      doc.rect(15, currentY, pageWidth - 30, 35, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`Active Financial Rule: ${selectedRule.toUpperCase()}`, 20, currentY + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      if (selectedRule === '50-30-20') {
        doc.text('• Needs (50%): Housing, utilities, groceries, insurance', 25, currentY + 16);
        doc.text('• Wants (30%): Entertainment, dining out, hobbies', 25, currentY + 22);
        doc.text('• Savings (20%): Emergency fund, investments, debt repayment', 25, currentY + 28);
      } else if (selectedRule === 'pay-yourself-first') {
        const savingsPercentage = user.savingsPercentage || 20;
        doc.text(`• Target Savings: ${savingsPercentage}% of income`, 25, currentY + 16);
        const savingsGoal = filteredIncome > 0 ? filteredIncome * savingsPercentage / 100 : 0;
        const availableForExpenses = filteredIncome > 0 ? filteredIncome * (100 - savingsPercentage) / 100 : 0;
        doc.text(`• Period Savings Goal: ${formatCurrency(savingsGoal, user.currency as Currency)}`, 25, currentY + 22);
        doc.text(`• Available for Expenses: ${formatCurrency(availableForExpenses, user.currency as Currency)}`, 25, currentY + 28);
      }
      
      currentY += 45;
      
      // KEY OBSERVATIONS
      doc.setFillColor(255, 247, 237);
      doc.rect(15, currentY, pageWidth - 30, 45, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('KEY OBSERVATIONS & RECOMMENDATIONS', 20, currentY + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(92, 45, 10);
      
      // Generate insights safely
      const insights = [];
      try {
        if (topCategory) {
          insights.push(`• Highest spending: ${topCategory[0]} (${spendingPercentage}% of expenses)`);
        }
        if (filteredBalance < 0) {
          insights.push(`• Warning: Expenses exceed income by ${formatCurrency(Math.abs(filteredBalance), user.currency as Currency)}`);
        } else if (filteredBalance > 0) {
          insights.push(`• Positive cash flow: ${formatCurrency(filteredBalance, user.currency as Currency)} available for savings`);
        }
        if (sortedCategories.length > 0 && filteredExpensesTotal > 0) {
          const avgSpending = filteredExpensesTotal / sortedCategories.length;
          insights.push(`• Average spending per category: ${formatCurrency(avgSpending, user.currency as Currency)}`);
        }
        insights.push(`• Total transactions recorded: ${filteredExpenses.length}`);
      } catch (insightError) {
        console.error('Error generating insights:', insightError);
        insights.push(`• Total transactions recorded: ${filteredExpenses.length}`);
      }
      
      insights.forEach((insight, index) => {
        doc.text(insight, 25, currentY + 16 + (index * 6));
      });
      
      // Add new page for transaction history
      doc.addPage();
      
      // PAGE 2 - TRANSACTION HISTORY
      // Add header for second page
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add accent stripe
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 37, pageWidth, 3, 'F');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('TRANSACTION HISTORY', pageWidth / 2, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Detailed record of recent financial activities', pageWidth / 2, 28, { align: 'center' });
      
      currentY = 50;
      
      // Filter and sort transactions for the period FIRST
      const filteredTransactions = [...filteredExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Add transaction summary
      doc.setFillColor(245, 243, 255);
      doc.rect(15, currentY, pageWidth - 30, 25, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Transaction Summary', 25, currentY + 8);
      
      const incomeTransactions = filteredTransactions.filter(t => t.type === 'income').length;
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense').length;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 25, currentY + 16);
      doc.text(`Income Transactions: ${incomeTransactions}`, 90, currentY + 16);
      doc.text(`Expense Transactions: ${expenseTransactions}`, 150, currentY + 16);
      
      currentY += 35;
      
      // Transaction table with improved styling
      const transactionData = filteredTransactions
        .slice(0, 15) // Reduced to 15 to fit better
        .map((transaction, index) => [
          (index + 1).toString(),
          new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          transaction.category,
          transaction.type === 'income' ? 'Credit' : 'Debit',
          formatCurrency(Math.abs(transaction.amount), user.currency as Currency),
          transaction.notes?.substring(0, 25) || '-'
        ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Date', 'Category', 'Type', 'Amount', 'Notes']],
        body: transactionData,
        theme: 'grid',
        headStyles: { 
          fillColor: [99, 102, 241],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 40 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 30, overflow: 'hidden' }
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto',
        didDrawCell: (data) => {
          // Color code the Type column
          if (data.column.index === 3 && data.cell.section === 'body') {
            const type = transactionData[data.row.index][3];
            if (type === 'Credit') {
              doc.setTextColor(34, 197, 94);
            } else {
              doc.setTextColor(239, 68, 68);
            }
            doc.text(type, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 1, { align: 'center' });
          }
        }
      });
      
      // Add financial health score at bottom of page 2
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Financial Health Score Card
      doc.setFillColor(239, 246, 255);
      doc.rect(15, currentY, pageWidth - 30, 30, 'F');
      
      // Calculate health score based on filtered data
      let healthScore = 50; // Base score
      if (filteredBalance > 0) healthScore += 20;
      if (filteredBalance > filteredIncome * 0.1) healthScore += 10;
      if (sortedCategories.length > 0 && sortedCategories[0][1] < filteredIncome * 0.3) healthScore += 10;
      if (filteredExpenses.length > 10) healthScore += 10; // Active tracking
      healthScore = Math.min(100, healthScore);
      
      // Get health status
      let healthStatus = '';
      let statusColor = [];
      if (healthScore >= 80) {
        healthStatus = 'Excellent';
        statusColor = [34, 197, 94];
      } else if (healthScore >= 60) {
        healthStatus = 'Good';
        statusColor = [99, 102, 241];
      } else if (healthScore >= 40) {
        healthStatus = 'Fair';
        statusColor = [251, 191, 36];
      } else {
        healthStatus = 'Needs Improvement';
        statusColor = [239, 68, 68];
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('Financial Health Score', 25, currentY + 10);
      
      // Score display
      doc.setFontSize(24);
      const [sc1, sc2, sc3] = statusColor;
      doc.setTextColor(sc1, sc2, sc3);
      doc.text(`${healthScore}`, 25, currentY + 22);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`/ 100`, 45, currentY + 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(sc1, sc2, sc3);
      doc.text(healthStatus, 80, currentY + 22);
      
      // Professional footer for all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(249, 250, 251);
        doc.rect(0, pageHeight - 35, pageWidth, 35, 'F');
        
        // Footer line with gradient effect
        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(1);
        doc.line(0, pageHeight - 35, pageWidth, pageHeight - 35);
        
        // Footer content
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('FINTRACK', 20, pageHeight - 25);
        doc.setFont('helvetica', 'normal');
        doc.text('Financial Statement - Confidential Document', 20, pageHeight - 19);
        
        // Disclaimer
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('This is a system-generated report. Errors and omissions excepted.', 20, pageHeight - 12);
        doc.text('All calculations are based on user-provided data.', 20, pageHeight - 7);
        
        // Page number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 19, { align: 'center' });
        
        // Right side info
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, pageHeight - 25);
        doc.text(`Currency: ${user.currency || 'USD'}`, pageWidth - 60, pageHeight - 19);
      }
      
      // Generate filename with timestamp
      const fileName = `FinTrack_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      doc.save(fileName);
      
      // Show success modal
      setPdfExportModal({
        isOpen: true,
        status: 'success',
        fileName
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      setPdfExportModal({
        isOpen: true,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.'
      });
    }
  };

  // Refresh data with live updates
  const refreshData = async () => {
    setLoading(true);
    try {
      const [expensesRes, goalsRes, profileRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/saving-goals'),
        fetch('/api/user/profile')
      ]);

      if (expensesRes.ok && goalsRes.ok && profileRes.ok) {
        const expensesData = await expensesRes.json();
        const goalsData = await goalsRes.json();
        const profileData = await profileRes.json();
        
        setExpenses(expensesData.expenses);
        setSavingGoals(goalsData.savingGoals);
        setUser(prev => ({ ...prev, ...profileData.user }));
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction: Expense) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Handle goal edit
  const handleEditGoal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  // Handle optimistic transaction creation
  const handleTransactionCreate = (newTransaction: Expense) => {
    setExpenses(prev => [newTransaction, ...prev]);
    toast.success('Transaction added');
  };

  // Handle optimistic transaction update  
  const handleTransactionUpdate = (updatedTransaction: any) => {
    if (updatedTransaction.tempId && updatedTransaction.realTransaction) {
      // Replace temp transaction with real one from server
      setExpenses(prev => prev.map(exp => 
        exp.id === updatedTransaction.tempId ? updatedTransaction.realTransaction : exp
      ));
    } else if (updatedTransaction.error) {
      // Handle error case - rollback
      if (updatedTransaction.action === 'create') {
        // Remove failed new transaction
        setExpenses(prev => prev.filter(exp => exp.id !== updatedTransaction.id));
        toast.error('Failed to add transaction');
      } else if (updatedTransaction.action === 'update' && updatedTransaction.original) {
        // Restore original on update failure
        setExpenses(prev => prev.map(exp => 
          exp.id === updatedTransaction.original.id ? updatedTransaction.original : exp
        ));
        toast.error('Failed to update transaction');
      }
    } else {
      // Normal update
      setExpenses(prev => prev.map(exp => 
        exp.id === updatedTransaction.id ? updatedTransaction : exp
      ));
    }
  };

  // Handle optimistic transaction delete
  const handleTransactionDelete = (id: string) => {
    const transaction = expenses.find(exp => exp.id === id);
    if (transaction) {
      setDeletedTransactions(prev => new Map(prev).set(id, transaction));
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success('Transaction deleted');
      
      // Make the delete API call
      fetch(`/api/expenses/${id}`, { method: 'DELETE' })
        .catch(err => {
          // Restore on error
          console.error('Delete failed:', err);
          setExpenses(prev => [...prev, transaction].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ));
          setDeletedTransactions(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
          toast.error('Failed to delete transaction');
        });
    }
  };

  // Handle successful goal save with live updates
  const handleGoalSuccess = () => {
    refreshData();
    setShowGoalModal(false);
    setEditingGoal(null);
    toast.success(editingGoal ? 'Goal updated' : 'Goal created');
  };

  // Render the appropriate financial rule widget with enhanced progress bars
  const renderFinancialRuleWidget = () => {
    const selectedRule = user.selectedRule || '50-30-20';
    const usePeriod = user.rulePeriod && user.periodStartDate;

    if (selectedRule === '50-30-20') {
      const ruleData = usePeriod 
        ? calculate50_30_20ForPeriod(
            expenses as any, 
            user.rulePeriod as any, 
            new Date(user.periodStartDate!),
            user.customPeriodDays || undefined
          )
        : calculate50_30_20(monthlyIncome, expenses as any);
      
      const periodIncome = usePeriod ? ruleData.totalBudget : monthlyIncome;
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white">50/30/20 Budget Rule</h3>
            <p className="text-white/80 text-sm mt-1">
              {usePeriod && 'period' in ruleData ? (ruleData as any).period.label + ' Income' : 'Monthly Income'}: {formatCurrency(periodIncome, user.currency as Currency)}
            </p>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <ProgressBar
              label="Needs (50%)"
              current={ruleData.spending.needs}
              target={ruleData.allocations.needs}
              color="blue"
              icon="🏠"
              description="Essentials like rent, groceries, utilities"
              currency={user.currency as Currency}
            />
            
            <ProgressBar
              label="Wants (30%)"
              current={ruleData.spending.wants}
              target={ruleData.allocations.wants}
              color="purple"
              icon="🎮"
              description="Entertainment, dining, hobbies"
              currency={user.currency as Currency}
            />
            
            <ProgressBar
              label="Savings (20%)"
              current={ruleData.spending.savings}
              target={ruleData.allocations.savings}
              color="green"
              icon="💰"
              description="Emergency fund, investments"
              currency={user.currency as Currency}
            />
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                <span className="text-lg font-bold text-gray-900">
                  {((ruleData.totalSpent / ruleData.totalBudget) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedRule === 'pay-yourself-first') {
      const ruleData = usePeriod
        ? calculatePayYourselfFirstForPeriod(
            expenses as any,
            user.savingsPercentage || 20,
            user.rulePeriod as any,
            new Date(user.periodStartDate!),
            user.customPeriodDays || undefined
          )
        : calculatePayYourselfFirst(
            monthlyIncome, 
            user.savingsPercentage || 20, 
            expenses as any
          );
      
      const periodIncome = usePeriod && 'periodIncome' in ruleData ? ruleData.periodIncome : monthlyIncome;
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
            <h3 className="text-xl font-bold text-white">Pay Yourself First</h3>
            <p className="text-white/80 text-sm mt-1">
              Saving {ruleData.savingsPercentage}% of {formatCurrency(monthlyIncome, user.currency as Currency)} monthly income
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ProgressBar
                  label="Monthly Savings Target"
                  current={ruleData.actualSavings}
                  target={ruleData.savingsTarget}
                  color="green"
                  icon="🎯"
                  currency={user.currency as Currency}
                />
              </div>
              <div>
                <ProgressBar
                  label="Budget for Expenses"
                  current={ruleData.totalExpenses}
                  target={ruleData.availableForExpenses}
                  color={ruleData.expensesOverBudget ? 'red' : 'blue'}
                  icon="💳"
                  currency={user.currency as Currency}
                />
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Remaining Budget</p>
                <p className={`text-2xl font-bold ${ruleData.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(ruleData.remainingBudget), user.currency as Currency)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${ruleData.isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
                  {ruleData.isOnTrack ? '✓ On Track' : '⚠ Behind'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedRule === 'smart-goal') {
      const primaryGoal = savingGoals.length > 0 
        ? savingGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
        : null;

      if (!primaryGoal) {
        return (
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <h3 className="text-xl font-bold text-white">SMART Goals</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">No saving goals set yet</p>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                Create Your First Goal
              </button>
            </div>
          </div>
        );
      }

      const goalData = calculateSmartGoal(primaryGoal as any, primaryGoal.saved, monthlyIncome);
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
            <h3 className="text-xl font-bold text-white">SMART Goal: {goalData.goalName}</h3>
            <p className="text-white/80 text-sm mt-1">
              Target: {formatCurrency(goalData.target, user.currency as Currency)} by {formatDate(goalData.deadline)}
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <CircularProgress
                percentage={goalData.progressPercentage}
                size={150}
                strokeWidth={12}
                label="Progress"
                value={formatCurrency(goalData.saved, user.currency as Currency)}
                color="purple"
              />
            </div>
            
            <div className="space-y-4">
              <ProgressBar
                label="Goal Progress"
                current={goalData.saved}
                target={goalData.target}
                color="purple"
                showPercentage={false}
              />
              
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-2">Forecast</p>
                <p className="text-sm text-purple-700">{goalData.forecastMessage}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Monthly Target</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(goalData.requiredMonthlySaving, user.currency as Currency)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Days Remaining</p>
                  <p className="text-lg font-bold text-gray-900">{goalData.daysUntilDeadline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-x-hidden">
      <ToastProvider />
      
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <Navbar 
        user={user}
        onAddTransaction={() => {
          setEditingTransaction(null);
          setShowTransactionModal(true);
        }}
        onAddGoal={() => {
          setEditingGoal(null);
          setShowGoalModal(true);
        }}
        onOpenProfile={() => setShowProfileSettings(true)}
      />

      {/* Main Content - Responsive Layout */}
      <main className="relative z-10 w-full px-3 sm:px-4 md:px-6 lg:max-w-7xl lg:mx-auto py-4 sm:py-6 lg:py-8">
        {/* Header with Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Track your financial overview</p>
          </div>
          <button
            onClick={() => setShowDateRangeSelector(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export PDF Report</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
        
        {/* Summary Cards - Top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SummaryCard title="Total Income" amount={totalIncome} color="green" icon="💰" currency={user.currency as Currency} />
          <SummaryCard title="Total Expenses" amount={totalExpenses} color="red" icon="💳" currency={user.currency as Currency} />
          <SummaryCard title="Net Balance" amount={balance} color="blue" icon="📊" currency={user.currency as Currency} />
          <SummaryCard title="This Month" amount={monthlyIncome} color="purple" icon="📅" currency={user.currency as Currency} />
        </div>

        {/* Charts Section - Middle */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Expenses Line Chart */}
          <ExpensesLineChartNew expenses={expenses} period={chartPeriod} currency={user.currency as Currency} />
          
          {/* Spending Pie Chart */}
          <SpendingPieChartNew expenses={expenses} currency={user.currency as Currency} />
        </div>

        {/* Period Management */}
        <PeriodSelector 
          user={{
            rulePeriod: user.rulePeriod || 'monthly',
            customPeriodDays: user.customPeriodDays,
            periodStartDate: user.periodStartDate || new Date().toISOString(),
            autoResetEnabled: user.autoResetEnabled !== false,
            currency: user.currency as Currency || 'USD'
          }}
          onUpdate={async (settings) => {
            try {
              const response = await fetch('/api/rule-period', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              });
              
              if (response.ok) {
                toast.success('Period settings updated successfully');
                router.refresh();
              } else {
                throw new Error('Failed to update settings');
              }
            } catch (error) {
              console.error('Error updating period settings:', error);
              toast.error('Failed to update period settings');
            }
          }}
        />

        {/* Financial Rule Widget */}
        <div className="mb-6 sm:mb-8">
          {renderFinancialRuleWidget()}
        </div>

        {/* Period Analytics */}
        <div className="mb-6 sm:mb-8">
          <PeriodAnalytics currency={user.currency as Currency || 'USD'} />
        </div>

        {/* Bill Reminders Section */}
        <div className="mb-6 sm:mb-8">
          <BillReminderManager />
        </div>

        {/* Collapsible Forms Section */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {/* Add Transaction Form */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => setShowAddTransaction(!showAddTransaction)}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex justify-between items-center hover:from-indigo-600 hover:to-blue-700 transition-colors"
            >
              <span className="font-semibold">➕ Add Transaction</span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${showAddTransaction ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showAddTransaction && (
              <div className="p-6">
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowTransactionModal(true);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700"
                >
                  Open Transaction Form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tables Section - Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Recent Transactions</h3>
            </div>
            <div className="p-3 sm:p-4 h-[400px] overflow-hidden">
              {allTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                  {allTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleEditTransaction(transaction)}
                      className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg ${getCategoryColor(transaction.category)}`}>
                          {(() => {
                            const Icon = getCategoryIcon(transaction.category, transaction.type as 'income' | 'expense');
                            return <Icon className="w-5 h-5" />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.category}</p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`font-semibold text-sm sm:text-base flex-shrink-0 ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, user.currency as Currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Saving Goals */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">Saving Goals</h3>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="group relative flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                title="Add New Goal"
              >
                <svg 
                  className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div className="absolute -inset-1 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {savingGoals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No saving goals yet</p>
              ) : (
                savingGoals.slice(0, 3).map((goal) => {
                  const progress = (goal.saved / goal.target) * 100;
                  return (
                    <div 
                      key={goal.id} 
                      onClick={() => handleEditGoal(goal)}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{goal.name}</h4>
                        <span className="text-sm font-semibold text-gray-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar
                        label=""
                        current={goal.saved}
                        target={goal.target}
                        color={progress >= 100 ? 'green' : progress >= 50 ? 'blue' : 'amber'}
                        showPercentage={false}
                        showValues={false}
                      />
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>{formatCurrency(goal.saved, user.currency as Currency)} / {formatCurrency(goal.target, user.currency as Currency)}</span>
                        <span>Due: {formatDate(goal.deadline)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <EditTransactionModalOptimistic
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionCreate}
        onUpdate={handleTransactionUpdate}
        onDelete={handleTransactionDelete}
        transaction={editingTransaction}
        currency={user.currency as Currency}
      />
      <EditGoalModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSuccess={handleGoalSuccess}
        goal={editingGoal}
        currency={user.currency as Currency}
      />
      {showProfileSettings && (
        <ProfileSettings
          user={{
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            selectedRule: user.selectedRule ?? null,
            savingsPercentage: user.savingsPercentage || 20,
            currency: user.currency
          }}
          onClose={() => setShowProfileSettings(false)}
          onSuccess={async (updatedUser) => {
            setShowProfileSettings(false);
            // Update the user state with new currency
            setUser(prev => ({ ...prev, ...updatedUser }));
            toast.success('Profile updated successfully');
          }}
        />
      )}

      {/* PDF Export Modal */}
      <PDFExportModal
        isOpen={pdfExportModal.isOpen}
        onClose={() => setPdfExportModal({ isOpen: false, status: 'generating' })}
        status={pdfExportModal.status}
        fileName={pdfExportModal.fileName}
        error={pdfExportModal.error}
      />
      
      {/* Date Range Selector Modal */}
      <DateRangeSelectorModal
        isOpen={showDateRangeSelector}
        onClose={() => setShowDateRangeSelector(false)}
        onConfirm={(startDate, endDate, periodLabel) => {
          generatePDFReport(startDate, endDate, periodLabel);
        }}
      />
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, amount, color, icon, currency = 'USD' }: {
  title: string;
  amount: number;
  color: string;
  icon: string;
  currency?: Currency;
}) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-pink-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600'
  }[color] || 'from-gray-500 to-gray-600';

  const textColor = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  }[color] || 'text-gray-600';

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${colorClasses} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-lg sm:text-xl text-white">{icon}</span>
        </div>
        <div className={`w-8 h-8 bg-gradient-to-r ${colorClasses} rounded-lg flex items-center justify-center shadow-md`}>
          <svg 
            className="w-4 h-4 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {amount >= 0 ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            )}
          </svg>
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r ${colorClasses} opacity-5 rounded-full`}></div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-xl sm:text-2xl font-bold ${amount < 0 ? 'text-red-600' : textColor}`}>
        {amount < 0 && '-'}{formatCurrency(Math.abs(amount), currency)}
      </p>
    </div>
  );
}