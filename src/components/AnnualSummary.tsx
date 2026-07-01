/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BudgetData } from '../types';
import { CATEGORIES, MONTH_NAMES } from '../data/defaultData';
import { 
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';

interface AnnualSummaryProps {
  data: BudgetData;
}

export default function AnnualSummary({ data }: AnnualSummaryProps) {
  
  // Group values by Month for the entire year 2026
  const monthlyStats = useMemo(() => {
    return MONTH_NAMES.map(m => {
      const monthKey = `2026-${m.value}`;
      
      const incomes = data.incomes.filter(inc => inc.month === monthKey);
      const expenses = data.expenses.filter(exp => exp.month === monthKey);

      const totalIncome = incomes.reduce((sum, item) => sum + item.actual, 0);
      const totalExpense = expenses.reduce((sum, item) => sum + item.actual, 0);
      
      // Savings is defined as the actual amount logged in the "Ahorro" category
      const totalSavings = expenses
        .filter(exp => exp.category === 'Ahorro')
        .reduce((sum, item) => sum + item.actual, 0);

      const freeCash = totalIncome - totalExpense;

      return {
        monthCode: m.value,
        monthName: m.name,
        income: totalIncome,
        expense: totalExpense,
        savings: totalSavings,
        freeCash: freeCash
      };
    });
  }, [data.incomes, data.expenses]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let savings = 0;
    let freeCash = 0;

    monthlyStats.forEach(stat => {
      income += stat.income;
      expense += stat.expense;
      savings += stat.savings;
      freeCash += stat.freeCash;
    });

    return { income, expense, savings, freeCash };
  }, [monthlyStats]);

  // Max values for horizontal progress calculations
  const maxValues = useMemo(() => {
    const incomes = monthlyStats.map(s => s.income);
    const expenses = monthlyStats.map(s => s.expense);
    const savings = monthlyStats.map(s => s.savings);
    const freeCashes = monthlyStats.map(s => Math.abs(s.freeCash));

    return {
      income: Math.max(...incomes, 1),
      expense: Math.max(...expenses, 1),
      savings: Math.max(...savings, 1),
      freeCash: Math.max(...freeCashes, 1)
    };
  }, [monthlyStats]);

  // Donut chart: Resumen General (Income breakdown)
  const generalBreakdownData = useMemo(() => {
    const spent = annualTotals.expense - annualTotals.savings;
    const saved = annualTotals.savings;
    const free = Math.max(0, annualTotals.freeCash);

    return [
      { name: 'Gastos de Vida', value: spent, color: '#ec4899' }, // Pink
      { name: 'Ahorro Total', value: saved, color: '#d946ef' },  // Magenta
      { name: 'Dinero Disponible', value: free, color: '#818cf8' } // Indigo
    ].filter(item => item.value > 0);
  }, [annualTotals]);

  // Pie chart: Annual Categories breakdown
  const annualCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      map[cat.name] = 0;
    });

    data.expenses.forEach(exp => {
      if (exp.month.startsWith('2026') && exp.actual > 0) {
        const cat = exp.category || 'Otros';
        if (!map[cat]) map[cat] = 0;
        map[cat] += exp.actual;
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [data.expenses]);

  return (
    <div className="space-y-8" id="annual-summary-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-500/10 via-lavender-500/10 to-violet-500/10 rounded-2xl p-6 border border-pink-100/50" id="annual-header-banner">
        <h2 className="text-3xl font-display font-bold text-gray-800 tracking-tight">
          Así se van viendo mis finanzas durante el año
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Resumen consolidado, estadísticas automáticas y control de liquidez anual (2026)
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="annual-kpi-grid">
        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Ingresos Totales</span>
            <p className="text-2xl font-bold font-mono text-gray-800">
              L {annualTotals.income.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Sueldo + Extras</span>
            </div>
          </div>
          <div className="p-3 bg-pink-50 rounded-xl text-pink-500">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Gastos Totales</span>
            <p className="text-2xl font-bold font-mono text-gray-800">
              L {annualTotals.expense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Fijos + Variables</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Ahorro Total</span>
            <p className="text-2xl font-bold font-mono text-gray-800">
              L {annualTotals.savings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-fuchsia-500 font-bold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Fondos Registrados</span>
            </div>
          </div>
          <div className="p-3 bg-fuchsia-50 rounded-xl text-fuchsia-500">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Dinero Libre Total</span>
            <p className="text-2xl font-bold font-mono text-gray-800">
              L {annualTotals.freeCash.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-violet-500 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Excedente Anual</span>
            </div>
          </div>
          <div className="p-3 bg-violet-50 rounded-xl text-violet-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4-Column Month-by-month tracking (Matches the gorgeous screenshot layout!) */}
      <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm overflow-x-auto" id="annual-month-by-month-columns">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
          Detalle Mensual de Control Financiero
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 min-w-[900px]">
          {/* Column 1: Ingresos Totales */}
          <div className="space-y-4">
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-center">
              <h4 className="text-sm font-bold text-pink-700">Ingresos Totales</h4>
              <p className="text-xs font-mono text-gray-500 mt-0.5">L {annualTotals.income.toLocaleString('es-ES')}</p>
            </div>
            <div className="space-y-2">
              {monthlyStats.map(stat => {
                const percentage = Math.max(3, (stat.income / maxValues.income) * 100);
                return (
                  <div key={stat.monthCode} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="w-8 font-medium text-gray-400">{stat.monthName.slice(0, 3)}</span>
                    <div className="flex-1 bg-gray-50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-pink-400 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-14 text-right font-mono font-bold text-gray-700">L {Math.round(stat.income).toLocaleString('es-ES')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Gastos Totales */}
          <div className="space-y-4">
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center">
              <h4 className="text-sm font-bold text-indigo-700">Gastos Totales</h4>
              <p className="text-xs font-mono text-gray-500 mt-0.5">L {annualTotals.expense.toLocaleString('es-ES')}</p>
            </div>
            <div className="space-y-2">
              {monthlyStats.map(stat => {
                const percentage = Math.max(3, (stat.expense / maxValues.expense) * 100);
                return (
                  <div key={stat.monthCode} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="w-8 font-medium text-gray-400">{stat.monthName.slice(0, 3)}</span>
                    <div className="flex-1 bg-gray-50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-14 text-right font-mono font-bold text-gray-700">L {Math.round(stat.expense).toLocaleString('es-ES')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Ahorro Total */}
          <div className="space-y-4">
            <div className="bg-fuchsia-50/50 p-3 rounded-xl border border-fuchsia-100 text-center">
              <h4 className="text-sm font-bold text-fuchsia-700">Ahorro Real</h4>
              <p className="text-xs font-mono text-gray-500 mt-0.5">L {annualTotals.savings.toLocaleString('es-ES')}</p>
            </div>
            <div className="space-y-2">
              {monthlyStats.map(stat => {
                const percentage = Math.max(3, (stat.savings / maxValues.savings) * 100);
                return (
                  <div key={stat.monthCode} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="w-8 font-medium text-gray-400">{stat.monthName.slice(0, 3)}</span>
                    <div className="flex-1 bg-gray-50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-fuchsia-400 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-14 text-right font-mono font-bold text-gray-700">L {Math.round(stat.savings).toLocaleString('es-ES')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 4: Dinero Libre */}
          <div className="space-y-4">
            <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100 text-center">
              <h4 className="text-sm font-bold text-violet-700">Dinero Libre</h4>
              <p className="text-xs font-mono text-gray-500 mt-0.5">L {annualTotals.freeCash.toLocaleString('es-ES')}</p>
            </div>
            <div className="space-y-2">
              {monthlyStats.map(stat => {
                const isNegative = stat.freeCash < 0;
                const absValue = Math.abs(stat.freeCash);
                const percentage = Math.max(3, (absValue / maxValues.freeCash) * 100);
                return (
                  <div key={stat.monthCode} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="w-8 font-medium text-gray-400">{stat.monthName.slice(0, 3)}</span>
                    <div className="flex-1 bg-gray-50 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isNegative ? 'bg-rose-400' : 'bg-violet-400'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className={`w-14 text-right font-mono font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isNegative ? '-' : ''}L {Math.round(absValue).toLocaleString('es-ES')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="annual-analytics-row">
        {/* Trend Area Chart (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-pink-100 shadow-sm" id="annual-trend-chart">
          <h3 className="text-md font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
            Tendencia de Flujo de Caja
          </h3>
          <p className="text-[11px] text-gray-400 mb-4">Evolución mensual de Ingresos y Egresos reales durante el año</p>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="monthName" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`L ${value.toLocaleString('es-ES')}`]}
                  contentStyle={{ background: '#fff', border: '1px solid #fbcfe8', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="income" name="Ingreso Real" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Egreso Real" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Resumen General (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex flex-col items-center" id="annual-general-chart">
          <h3 className="text-md font-bold text-gray-800 text-left w-full mb-1 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-fuchsia-500 rounded-full"></span>
            Resumen General
          </h3>
          <p className="text-[11px] text-gray-400 text-left w-full mb-4">Destino de los ingresos anuales</p>

          <div className="w-full h-48 flex items-center justify-center">
            {generalBreakdownData.length === 0 ? (
              <p className="text-xs text-gray-400 py-10">Sin datos acumulados aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={generalBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {generalBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`L ${value.toFixed(2)}`]}
                    contentStyle={{ background: '#fff', border: '1px solid #fbcfe8', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom legend */}
          <div className="space-y-1.5 w-full mt-2">
            {generalBreakdownData.map((entry, index) => {
              const totalVal = generalBreakdownData.reduce((s, item) => s + item.value, 0) || 1;
              const percent = ((entry.value / totalVal) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-700">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart: Gastos por Categoría (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex flex-col items-center" id="annual-categories-chart">
          <h3 className="text-md font-bold text-gray-800 text-left w-full mb-1 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
            Gastos por Categoría
          </h3>
          <p className="text-[11px] text-gray-400 text-left w-full mb-4">Consolidado anual por rubro</p>

          <div className="w-full h-48 flex items-center justify-center">
            {annualCategoryData.length === 0 ? (
              <p className="text-xs text-gray-400 py-10">Sin gastos cargados aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={annualCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {annualCategoryData.map((entry, index) => {
                      const color = CATEGORIES.find(c => c.name === entry.name)?.color || '#94a3b8';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`L ${value.toFixed(2)}`]}
                    contentStyle={{ background: '#fff', border: '1px solid #fbcfe8', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 w-full max-h-24 overflow-y-auto">
            {annualCategoryData.slice(0, 6).map((entry, index) => {
              const color = CATEGORIES.find(c => c.name === entry.name)?.color || '#94a3b8';
              return (
                <div key={index} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                  <span className="truncate">{entry.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
