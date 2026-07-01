/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Income {
  id: string;
  concept: string;
  date: string;
  source: string;
  budgeted: number;
  actual: number;
  month: string; // YYYY-MM
}

export interface Expense {
  id: string;
  concept: string;
  date: string;
  type: 'Fijo' | 'Variable';
  category: string;
  budgeted: number;
  actual: number;
  cleared: boolean;
  month: string; // YYYY-MM
}

export interface MonthlyGoal {
  id: string;
  text: string;
  completed: boolean;
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  balance: number;
  startDate: string;
  endDate: string;
  color: string;
  notes: string;
}

export interface SavingsTransaction {
  id: string;
  goalId: string;
  date: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  notes: string;
}

export interface BudgetData {
  incomes: Income[];
  expenses: Array<Expense>;
  monthlyGoals: MonthlyGoal[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
}

export interface SheetsSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSynced: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage: string | null;
}
