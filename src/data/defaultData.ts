/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetData, SavingsGoal, SavingsTransaction } from '../types';

export const CATEGORIES = [
  { name: 'Vivienda', color: '#ec4899', icon: 'Home' },      // Pink
  { name: 'Servicios', color: '#f472b6', icon: 'Zap' },       // Light Pink
  { name: 'Alimentación', color: '#d946ef', icon: 'Utensils' },// Magenta/Purple
  { name: 'Transporte', color: '#a855f7', icon: 'Car' },       // Violet
  { name: 'Entretenimiento', color: '#c084fc', icon: 'Sparkles' }, // Soft Violet
  { name: 'Salud', color: '#818cf8', icon: 'HeartPulse' },    // Indigo
  { name: 'Ahorro', color: '#fb7185', icon: 'PiggyBank' },     // Rose
  { name: 'Otros', color: '#94a3b8', icon: 'HelpCircle' }      // Gray
];

export const MONTH_NAMES = [
  { value: '01', name: 'Enero' },
  { value: '02', name: 'Febrero' },
  { value: '03', name: 'Marzo' },
  { value: '04', name: 'Abril' },
  { value: '05', name: 'Mayo' },
  { value: '06', name: 'Junio' },
  { value: '07', name: 'Julio' },
  { value: '08', name: 'Agosto' },
  { value: '09', name: 'Septiembre' },
  { value: '10', name: 'Octubre' },
  { value: '11', name: 'Noviembre' },
  { value: '12', name: 'Diciembre' }
];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia',
    target: 10000,
    balance: 5500,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    color: '#ec4899', // Pink
    notes: 'Dinero de seguridad para cubrir 6 meses de gastos básicos.'
  },
  {
    id: 'goal-2',
    name: 'Vacaciones de Invierno',
    target: 3000,
    balance: 1500,
    startDate: '2026-03-01',
    endDate: '2026-12-15',
    color: '#d946ef', // Magenta
    notes: 'Viaje familiar de fin de año a la playa.'
  },
  {
    id: 'goal-3',
    name: 'Enganche Auto Nuevo',
    target: 15000,
    balance: 4200,
    startDate: '2026-01-15',
    endDate: '2027-06-30',
    color: '#818cf8', // Indigo
    notes: 'Ahorro a mediano plazo para comprar un auto híbrido.'
  }
];

export const DEFAULT_SAVINGS_TRANSACTIONS: SavingsTransaction[] = [
  { id: 't-1', goalId: 'goal-1', date: '2026-01-10', type: 'deposit', amount: 1000, notes: 'Aporte inicial de año' },
  { id: 't-2', goalId: 'goal-1', date: '2026-02-10', type: 'deposit', amount: 500, notes: 'Aporte mensual estándar' },
  { id: 't-3', goalId: 'goal-1', date: '2026-03-10', type: 'deposit', amount: 500, notes: 'Aporte mensual estándar' },
  { id: 't-4', goalId: 'goal-1', date: '2026-04-10', type: 'deposit', amount: 1500, notes: 'Bono trimestral depositado aquí' },
  { id: 't-5', goalId: 'goal-1', date: '2026-05-10', type: 'deposit', amount: 1000, notes: 'Aporte adicional' },
  { id: 't-6', goalId: 'goal-1', date: '2026-06-10', type: 'deposit', amount: 1000, notes: 'Aporte mensual' },
  
  { id: 't-7', goalId: 'goal-2', date: '2026-03-15', type: 'deposit', amount: 300, notes: 'Aporte inicial' },
  { id: 't-8', goalId: 'goal-2', date: '2026-04-15', type: 'deposit', amount: 300, notes: 'Aporte mensual' },
  { id: 't-9', goalId: 'goal-2', date: '2026-05-15', type: 'deposit', amount: 300, notes: 'Aporte mensual' },
  { id: 't-10', goalId: 'goal-2', date: '2026-06-15', type: 'deposit', amount: 600, notes: 'Regalo de cumpleaños' },

  { id: 't-11', goalId: 'goal-3', date: '2026-01-20', type: 'deposit', amount: 1200, notes: 'Bono de fin de año' },
  { id: 't-12', goalId: 'goal-3', date: '2026-02-20', type: 'deposit', amount: 500, notes: 'Aporte mensual' },
  { id: 't-13', goalId: 'goal-3', date: '2026-03-20', type: 'deposit', amount: 500, notes: 'Aporte mensual' },
  { id: 't-14', goalId: 'goal-3', date: '2026-04-20', type: 'deposit', amount: 500, notes: 'Aporte mensual' },
  { id: 't-15', goalId: 'goal-3', date: '2026-05-20', type: 'deposit', amount: 500, notes: 'Aporte mensual' },
  { id: 't-16', goalId: 'goal-3', date: '2026-06-20', type: 'deposit', amount: 1000, notes: 'Aporte mensual extra' }
];

export function getInitialBudgetData(): BudgetData {
  const incomes: any[] = [];
  const expenses: any[] = [];
  const monthlyGoals: any[] = [];

  // Generate data from January (01) to December (12) of 2026
  for (let m = 1; m <= 12; m++) {
    const monthStr = `2026-${m.toString().padStart(2, '0')}`;
    
    // Monthly Goals
    monthlyGoals.push(
      { id: `goal-${monthStr}-1`, text: 'Limitar salidas los fines de semana', completed: m < 6, month: monthStr },
      { id: `goal-${monthStr}-2`, text: 'Alcanzar meta de ahorro sugerida', completed: m < 6, month: monthStr },
      { id: `goal-${monthStr}-3`, text: 'Revisar suscripciones mensuales', completed: m <= 3, month: monthStr }
    );

    // Incomes
    const baseSueldo = 3500;
    const extraWork = m % 2 === 0 ? 600 : 300;
    const sales = m % 3 === 0 ? 250 : 100;

    incomes.push(
      { id: `inc-${monthStr}-1`, concept: 'Nómina Principal', date: `${monthStr}-01`, source: 'Sueldo', budgeted: baseSueldo, actual: baseSueldo, month: monthStr },
      { id: `inc-${monthStr}-2`, concept: 'Trabajo Freelance / Extra', date: `${monthStr}-12`, source: 'Extras', budgeted: 400, actual: extraWork, month: monthStr },
      { id: `inc-${monthStr}-3`, concept: 'Venta de artículos usados', date: `${monthStr}-22`, source: 'Ventas', budgeted: 150, actual: sales, month: monthStr }
    );

    // Expenses (Standard values with small variations)
    // Categories: Vivienda, Servicios, Alimentación, Transporte, Entretenimiento, Salud, Ahorro, Otros
    const housingVal = 1200;
    const servicesVal = 220 + (m % 3) * 30; // 220, 250, 280
    const foodVal = 450 + (m % 2) * 40;     // 450, 490
    const transportVal = 200 + (m % 4) * 15; // 200, 215, 230, 245
    const entertainmentVal = 250 + (m % 5) * 50; // 250, 300, 350, 400, 450
    const healthVal = m % 4 === 0 ? 300 : 100;
    const savingsVal = 500;
    const otherVal = 150 + (m % 2) * 50;

    const actualDiff = (base: number, multiplier = 0.08) => {
      // Create some variance for 'actual' expenses, especially for variable categories
      if (m > 6) {
        // If future month, don't fill actuals or keep actual = 0/empty to represent "not spent yet"
        return 0;
      }
      const randomPercent = 1 + (Math.sin(m + base) * multiplier);
      return Math.round(base * randomPercent * 100) / 100;
    };

    const isFuture = m > 6;

    expenses.push(
      { id: `exp-${monthStr}-1`, concept: 'Alquiler Departamento', date: `${monthStr}-02`, type: 'Fijo', category: 'Vivienda', budgeted: housingVal, actual: isFuture ? 0 : housingVal, cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-2`, concept: 'Internet y Electricidad', date: `${monthStr}-05`, type: 'Fijo', category: 'Servicios', budgeted: servicesVal, actual: isFuture ? 0 : actualDiff(servicesVal, 0.04), cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-3`, concept: 'Compra Supermercado Semanal', date: `${monthStr}-08`, type: 'Variable', category: 'Alimentación', budgeted: foodVal, actual: isFuture ? 0 : actualDiff(foodVal, 0.08), cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-4`, concept: 'Gasolina y Transporte Público', date: `${monthStr}-10`, type: 'Variable', category: 'Transporte', budgeted: transportVal, actual: isFuture ? 0 : actualDiff(transportVal, 0.1), cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-5`, concept: 'Cenas y Salidas', date: `${monthStr}-15`, type: 'Variable', category: 'Entretenimiento', budgeted: entertainmentVal, actual: isFuture ? 0 : actualDiff(entertainmentVal, 0.25), cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-6`, concept: 'Seguro Médico / Farmacia', date: `${monthStr}-18`, type: 'Fijo', category: 'Salud', budgeted: healthVal, actual: isFuture ? 0 : healthVal, cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-7`, concept: 'Transferencia Fondo de Emergencia', date: `${monthStr}-25`, type: 'Fijo', category: 'Ahorro', budgeted: savingsVal, actual: isFuture ? 0 : savingsVal, cleared: !isFuture, month: monthStr },
      { id: `exp-${monthStr}-8`, concept: 'Gastos Imprevistos', date: `${monthStr}-28`, type: 'Variable', category: 'Otros', budgeted: otherVal, actual: isFuture ? 0 : actualDiff(otherVal, 0.3), cleared: !isFuture, month: monthStr }
    );
  }

  return {
    incomes,
    expenses,
    monthlyGoals,
    savingsGoals: DEFAULT_SAVINGS_GOALS,
    savingsTransactions: DEFAULT_SAVINGS_TRANSACTIONS
  };
}
