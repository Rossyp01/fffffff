/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Calendar, 
  TrendingUp, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Circle
} from 'lucide-react';
import { BudgetData, Income, Expense, MonthlyGoal } from '../types';
import { CATEGORIES, MONTH_NAMES } from '../data/defaultData';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface MonthlyViewProps {
  data: BudgetData;
  setData: (updater: BudgetData | ((prev: BudgetData) => BudgetData)) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
}

export default function MonthlyView({ data, setData, selectedMonth, setSelectedMonth }: MonthlyViewProps) {
  const [newGoalText, setNewGoalText] = useState('');

  // Extract year and month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const yearNum = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  const monthLabel = useMemo(() => {
    const found = MONTH_NAMES.find(m => m.value === monthStr);
    return found ? found.name : 'Mes';
  }, [monthStr]);

  // Handle Month Stepping
  const handlePrevMonth = () => {
    let newMonth = monthNum - 1;
    let newYear = yearNum;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newMonth = monthNum + 1;
    let newYear = yearNum;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  };

  // Filter Data for current month
  const monthlyIncomes = useMemo(() => {
    return data.incomes.filter(inc => inc.month === selectedMonth);
  }, [data.incomes, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return data.expenses.filter(exp => exp.month === selectedMonth);
  }, [data.expenses, selectedMonth]);

  const monthlyGoals = useMemo(() => {
    return data.monthlyGoals.filter(goal => goal.month === selectedMonth);
  }, [data.monthlyGoals, selectedMonth]);

  // Summaries
  const totals = useMemo(() => {
    const budgetedIncome = monthlyIncomes.reduce((sum, item) => sum + item.budgeted, 0);
    const actualIncome = monthlyIncomes.reduce((sum, item) => sum + item.actual, 0);
    const budgetedExpense = monthlyExpenses.reduce((sum, item) => sum + item.budgeted, 0);
    const actualExpense = monthlyExpenses.reduce((sum, item) => sum + item.actual, 0);
    const balanceBudgeted = budgetedIncome - budgetedExpense;
    const balanceActual = actualIncome - actualExpense;
    
    return {
      budgetedIncome,
      actualIncome,
      budgetedExpense,
      actualExpense,
      balanceBudgeted,
      balanceActual
    };
  }, [monthlyIncomes, monthlyExpenses]);

  // Add/Edit Income
  const addIncomeRow = () => {
    const newInc: Income = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concept: 'Nuevo Ingreso',
      date: `${selectedMonth}-01`,
      source: 'Sueldo',
      budgeted: 0,
      actual: 0,
      month: selectedMonth
    };
    setData(prev => ({
      ...prev,
      incomes: [...prev.incomes, newInc]
    }));
  };

  const updateIncomeRow = (id: string, field: keyof Income, value: any) => {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const deleteIncomeRow = (id: string) => {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(item => item.id !== id)
    }));
  };

  // Add/Edit Expense
  const addExpenseRow = () => {
    const newExp: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concept: 'Nuevo Egreso',
      date: `${selectedMonth}-15`,
      type: 'Variable',
      category: 'Otros',
      budgeted: 0,
      actual: 0,
      cleared: false,
      month: selectedMonth
    };
    setData(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExp]
    }));
  };

  const updateExpenseRow = (id: string, field: keyof Expense, value: any) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const deleteExpenseRow = (id: string) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(item => item.id !== id)
    }));
  };

  // Goals
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newGoal: MonthlyGoal = {
      id: `goal-${Date.now()}`,
      text: newGoalText.trim(),
      completed: false,
      month: selectedMonth
    };
    setData(prev => ({
      ...prev,
      monthlyGoals: [...prev.monthlyGoals, newGoal]
    }));
    setNewGoalText('');
  };

  const toggleGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      monthlyGoals: prev.monthlyGoals.map(item => {
        if (item.id === id) {
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      monthlyGoals: prev.monthlyGoals.filter(item => item.id !== id)
    }));
  };

  // Guide Calendar Calculation
  const calendarDays = useMemo(() => {
    const date = new Date(yearNum, monthNum - 1, 1);
    const firstDayIndex = date.getDay(); // 0 is Sunday, 1 is Monday etc
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    
    // Previous month's trailing days
    const prevLastDay = new Date(yearNum, monthNum - 1, 0).getDate();
    const trailingDays: { day: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    
    for (let i = firstDayIndex; i > 0; i--) {
      const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
      const prevYearNum = monthNum === 1 ? yearNum - 1 : yearNum;
      const d = prevLastDay - i + 1;
      trailingDays.push({
        day: d,
        isCurrentMonth: false,
        fullDate: `${prevYearNum}-${prevMonthNum.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      });
    }

    // Current month days
    const currentDays: { day: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    for (let i = 1; i <= lastDay; i++) {
      currentDays.push({
        day: i,
        isCurrentMonth: true,
        fullDate: `${selectedMonth}-${i.toString().padStart(2, '0')}`
      });
    }

    // Combined days
    const combined = [...trailingDays, ...currentDays];
    
    // Add remaining grid cells (multiple of 7 up to 42)
    const remainingCount = 42 - combined.length;
    for (let i = 1; i <= remainingCount; i++) {
      const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
      const nextYearNum = monthNum === 12 ? yearNum + 1 : yearNum;
      combined.push({
        day: i,
        isCurrentMonth: false,
        fullDate: `${nextYearNum}-${nextMonthNum.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
      });
    }

    return combined;
  }, [yearNum, monthNum, selectedMonth]);

  // Match expenses on calendar days
  const calendarExpenseMap = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    monthlyExpenses.forEach(exp => {
      if (exp.date && exp.actual > 0) {
        if (!map[exp.date]) {
          map[exp.date] = [];
        }
        map[exp.date].push(exp);
      }
    });
    return map;
  }, [monthlyExpenses]);

  // Chart Data: Gastos por Categoría (Pie Chart)
  const categoryChartData = useMemo(() => {
    const totalsMap: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      totalsMap[cat.name] = 0;
    });

    monthlyExpenses.forEach(exp => {
      const cat = exp.category || 'Otros';
      if (!totalsMap[cat]) totalsMap[cat] = 0;
      totalsMap[cat] += exp.actual; // visualising actual spend
    });

    return Object.entries(totalsMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [monthlyExpenses]);

  // Chart Data: Gastos por Semana (Bar Chart)
  const weeklyChartData = useMemo(() => {
    // Weeks: W1 (1-7), W2 (8-14), W3 (15-21), W4 (22+)
    const weeks = [
      { name: 'Semana 1 (1-7)', Presupuesto: 0, Real: 0 },
      { name: 'Semana 2 (8-14)', Presupuesto: 0, Real: 0 },
      { name: 'Semana 3 (15-21)', Presupuesto: 0, Real: 0 },
      { name: 'Semana 4 (22+)', Presupuesto: 0, Real: 0 }
    ];

    monthlyExpenses.forEach(exp => {
      const dayPart = parseInt(exp.date.split('-')[2] || '1');
      let weekIdx = 0;
      if (dayPart <= 7) weekIdx = 0;
      else if (dayPart <= 14) weekIdx = 1;
      else if (dayPart <= 21) weekIdx = 2;
      else weekIdx = 3;

      weeks[weekIdx].Presupuesto += exp.budgeted;
      weeks[weekIdx].Real += exp.actual;
    });

    return weeks;
  }, [monthlyExpenses]);

  return (
    <div className="space-y-6" id="monthly-view-root">
      {/* Month Navigator & Summary Row */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-6" id="monthly-navigator-panel">
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-pink-50 text-pink-500 transition-colors border border-pink-100/50"
            title="Mes Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-800 tracking-tight capitalize">
              {monthLabel}
            </h2>
            <p className="text-xs font-mono text-pink-400 mt-0.5 font-semibold">PLANIFICACIÓN {yearStr}</p>
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-pink-50 text-pink-500 transition-colors border border-pink-100/50"
            title="Mes Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Cards inside Monthly View */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full md:w-auto flex-1 max-w-2xl">
          <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100 flex items-center gap-3">
            <div className="p-2 bg-pink-100 text-pink-500 rounded-lg">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ingresos del Mes</p>
              <p className="text-lg font-bold text-gray-800 font-mono">L {totals.actualIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-pink-400 font-semibold">Presupuestado: L {totals.budgetedIncome.toLocaleString('es-ES')}</p>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-500 rounded-lg">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Egresos del Mes</p>
              <p className="text-lg font-bold text-gray-800 font-mono">L {totals.actualExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-indigo-400 font-semibold">Presupuestado: L {totals.budgetedExpense.toLocaleString('es-ES')}</p>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-violet-50/50 rounded-xl p-4 border border-violet-100 flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-500 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance Neto</p>
              <p className={`text-lg font-bold font-mono ${totals.balanceActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                L {totals.balanceActual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-violet-400 font-semibold">Margen Plan: L {totals.balanceBudgeted.toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="monthly-main-grid">
        {/* LEFT COLUMN: Goals & Guide Calendar (xl:col-span-4) */}
        <div className="xl:col-span-3 space-y-6" id="monthly-left-column">
          {/* Monthly Goals */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60" id="monthly-goals-box">
            <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
              Objetivos del Mes
            </h3>
            
            <form onSubmit={addGoal} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Escribe un objetivo..."
                value={newGoalText}
                onChange={e => setNewGoalText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-sm border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors"
              />
              <button 
                type="submit"
                className="p-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {monthlyGoals.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Sin objetivos para este mes.</p>
              ) : (
                monthlyGoals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-pink-50/20 border border-pink-100/20 hover:bg-pink-50/40 transition-all">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="flex items-start gap-2.5 flex-1 text-left"
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-pink-300 mt-0.5 flex-shrink-0 hover:text-pink-400" />
                      )}
                      <span className={`text-xs ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                        {goal.text}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Guide Calendar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60" id="monthly-calendar-box">
            <h3 className="text-md font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              Calendario de Pagos
            </h3>
            <p className="text-[11px] text-gray-400 mb-3">Fechas guía marcadas con egresos activos</p>

            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-gray-400 font-semibold border-b border-gray-100 pb-2 mb-2">
              <span>D</span>
              <span>L</span>
              <span>M</span>
              <span>M</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, idx) => {
                const dayExpenses = calendarExpenseMap[cell.fullDate] || [];
                const hasExpenses = dayExpenses.length > 0;
                const isCurrent = cell.isCurrentMonth;
                
                return (
                  <div 
                    key={idx} 
                    className={`relative p-1.5 rounded-lg flex flex-col items-center justify-center min-h-10 transition-all border border-transparent ${
                      isCurrent ? 'hover:bg-pink-50/30' : 'opacity-20'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-gray-700' : 'text-gray-400'}`}>
                      {cell.day}
                    </span>
                    {hasExpenses && isCurrent && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" title={`${dayExpenses.length} egreso(s)`}></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Incomes and Expenses Spreadsheet tables (xl:col-span-6) */}
        <div className="xl:col-span-6 space-y-6" id="monthly-middle-column">
          
          {/* Ingresos (Income) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60" id="monthly-income-table">
            <div className="flex items-center justify-between mb-3 border-b border-pink-50 pb-2">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-400 rounded-full"></span>
                Ingresos del Mes
              </h3>
              <button
                onClick={addIncomeRow}
                className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 font-sans">
                    <th className="py-2 pl-2">Concepto</th>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Origen</th>
                    <th className="py-2 text-right">Presupuestado</th>
                    <th className="py-2 text-right pr-2">Real</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700 font-mono">
                  {monthlyIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400 font-sans">No hay registros de ingresos. Agrega uno arriba.</td>
                    </tr>
                  ) : (
                    monthlyIncomes.map(inc => (
                      <tr key={inc.id} className="hover:bg-gray-50/50 group transition-colors">
                        <td className="py-1.5 pl-2">
                          <input
                            type="text"
                            value={inc.concept}
                            onChange={e => updateIncomeRow(inc.id, 'concept', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-sans"
                          />
                        </td>
                        <td className="py-1.5">
                          <input
                            type="date"
                            value={inc.date}
                            onChange={e => updateIncomeRow(inc.id, 'date', e.target.value)}
                            className="px-1 py-1 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded text-[10px]"
                          />
                        </td>
                        <td className="py-1.5">
                          <input
                            type="text"
                            value={inc.source}
                            onChange={e => updateIncomeRow(inc.id, 'source', e.target.value)}
                            className="w-full px-1 py-1 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded"
                          />
                        </td>
                        <td className="py-1.5 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-gray-400 mr-1">L</span>
                            <input
                              type="number"
                              value={inc.budgeted}
                              onChange={e => updateIncomeRow(inc.id, 'budgeted', parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-1 text-right bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-bold text-gray-600"
                            />
                          </div>
                        </td>
                        <td className="py-1.5 text-right pr-2">
                          <div className="flex items-center justify-end">
                            <span className="text-pink-400 mr-1">L</span>
                            <input
                              type="number"
                              value={inc.actual}
                              onChange={e => updateIncomeRow(inc.id, 'actual', parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-1 text-right bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-bold text-gray-800"
                            />
                          </div>
                        </td>
                        <td className="py-1.5 text-center">
                          <button
                            onClick={() => deleteIncomeRow(inc.id)}
                            className="text-gray-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Egresos (Expenses) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60" id="monthly-expense-table">
            <div className="flex items-center justify-between mb-3 border-b border-pink-50 pb-2">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-pink-400 rounded-full"></span>
                Egresos del Mes
              </h3>
              <button
                onClick={addExpenseRow}
                className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 font-sans">
                    <th className="py-2 pl-2">Concepto</th>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Categoría</th>
                    <th className="py-2 text-right">Presupuesto</th>
                    <th className="py-2 text-right">Real</th>
                    <th className="py-2 text-center w-14">Pago</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700 font-mono">
                  {monthlyExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-400 font-sans">No hay registros de egresos. Agrega uno arriba.</td>
                    </tr>
                  ) : (
                    monthlyExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50/50 group transition-colors">
                        <td className="py-1.5 pl-2">
                          <input
                            type="text"
                            value={exp.concept}
                            onChange={e => updateExpenseRow(exp.id, 'concept', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-sans"
                          />
                        </td>
                        <td className="py-1.5">
                          <input
                            type="date"
                            value={exp.date}
                            onChange={e => updateExpenseRow(exp.id, 'date', e.target.value)}
                            className="px-1 py-1 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded text-[10px]"
                          />
                        </td>
                        <td className="py-1.5">
                          <select
                            value={exp.type}
                            onChange={e => updateExpenseRow(exp.id, 'type', e.target.value)}
                            className="px-1 py-0.5 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-sans text-[11px] font-semibold text-gray-500"
                          >
                            <option value="Fijo">Fijo</option>
                            <option value="Variable">Variable</option>
                          </select>
                        </td>
                        <td className="py-1.5">
                          <select
                            value={exp.category}
                            onChange={e => updateExpenseRow(exp.id, 'category', e.target.value)}
                            className="px-1 py-0.5 bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-sans text-[11px] text-gray-600"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-gray-400 mr-1">L</span>
                            <input
                              type="number"
                              value={exp.budgeted}
                              onChange={e => updateExpenseRow(exp.id, 'budgeted', parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-1 text-right bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-semibold text-gray-500"
                            />
                          </div>
                        </td>
                        <td className="py-1.5 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-pink-400 mr-1">L</span>
                            <input
                              type="number"
                              value={exp.actual}
                              onChange={e => updateExpenseRow(exp.id, 'actual', parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-1 text-right bg-transparent border border-transparent hover:border-pink-200 focus:bg-white focus:border-pink-300 focus:outline-none rounded font-bold text-gray-800"
                            />
                          </div>
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={exp.cleared}
                            onChange={e => updateExpenseRow(exp.id, 'cleared', e.target.checked)}
                            className="w-4 h-4 rounded border-pink-300 text-pink-500 focus:ring-pink-400 cursor-pointer"
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <button
                            onClick={() => deleteExpenseRow(exp.id)}
                            className="text-gray-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Dashboard Charts (xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-6" id="monthly-right-column">
          
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60 flex flex-col items-center" id="monthly-pie-chart-box">
            <h3 className="text-sm font-bold text-gray-800 text-left w-full mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-pink-400 rounded-full"></span>
              Gastos por Categoría
            </h3>
            <p className="text-[11px] text-gray-400 text-left w-full mb-4">Distribución del gasto real de este mes</p>
            
            <div className="w-full h-48 flex items-center justify-center">
              {categoryChartData.length === 0 ? (
                <p className="text-xs text-gray-400 py-10">Ingresa egresos para generar gráfica.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => {
                        const catColor = CATEGORIES.find(c => c.name === entry.name)?.color || '#94a3b8';
                        return <Cell key={`cell-${index}`} fill={catColor} />;
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`L ${value.toFixed(2)}`, 'Gasto']}
                      contentStyle={{ background: '#fff', border: '1px solid #fbcfe8', borderRadius: '12px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full max-h-24 overflow-y-auto">
              {categoryChartData.map((entry, index) => {
                const catColor = CATEGORIES.find(c => c.name === entry.name)?.color || '#94a3b8';
                return (
                  <div key={index} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }}></span>
                    <span className="truncate font-medium">{entry.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/60" id="monthly-bar-chart-box">
            <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-400 rounded-full"></span>
              Gastos por Semana
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">Compara Presupuesto vs Gasto Real</p>

            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [`L ${value.toFixed(2)}`]}
                    contentStyle={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="Presupuesto" fill="#e9d5ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Real" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
