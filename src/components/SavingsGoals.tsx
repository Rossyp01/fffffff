/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BudgetData, SavingsGoal, SavingsTransaction } from '../types';
import { Plus, Trash2, Calendar, Target, DollarSign, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface SavingsGoalsProps {
  data: BudgetData;
  setData: (updater: BudgetData | ((prev: BudgetData) => BudgetData)) => void;
}

export default function SavingsGoals({ data, setData }: SavingsGoalsProps) {
  // Local form states
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(1000);
  const [newGoalStart, setNewGoalStart] = useState('2026-01-01');
  const [newGoalEnd, setNewGoalEnd] = useState('2026-12-31');
  const [newGoalColor, setNewGoalColor] = useState('#ec4899');
  const [newGoalNotes, setNewGoalNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Transaction form states
  const [txGoalId, setTxGoalId] = useState('');
  const [txDate, setTxDate] = useState('2026-06-30');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txAmount, setTxAmount] = useState(100);
  const [txNotes, setTxNotes] = useState('');

  // Auto-select first goal for transaction logging if available
  React.useEffect(() => {
    if (data.savingsGoals.length > 0 && !txGoalId) {
      setTxGoalId(data.savingsGoals[0].id);
    }
  }, [data.savingsGoals, txGoalId]);

  // Aggregate metrics
  const totalSaved = useMemo(() => {
    return data.savingsGoals.reduce((sum, goal) => sum + goal.balance, 0);
  }, [data.savingsGoals]);

  const totalTarget = useMemo(() => {
    return data.savingsGoals.reduce((sum, goal) => sum + goal.target, 0);
  }, [data.savingsGoals]);

  const overallProgressPercent = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.round((totalSaved / totalTarget) * 100);
  }, [totalSaved, totalTarget]);

  // Handle Adding a Savings Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName.trim(),
      target: newGoalTarget,
      balance: 0,
      startDate: newGoalStart,
      endDate: newGoalEnd,
      color: newGoalColor,
      notes: newGoalNotes.trim()
    };

    setData(prev => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal]
    }));

    // Reset Form
    setNewGoalName('');
    setNewGoalTarget(1000);
    setNewGoalNotes('');
    setShowAddForm(false);
  };

  // Handle Deleting a Goal
  const handleDeleteGoal = (goalId: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta meta de ahorro y su historial de transacciones?');
    if (!confirmDelete) return;

    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(g => g.id !== goalId),
      savingsTransactions: prev.savingsTransactions.filter(t => t.goalId !== goalId)
    }));
  };

  // Handle Adding a Transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txGoalId || txAmount <= 0) return;

    const selectedGoal = data.savingsGoals.find(g => g.id === txGoalId);
    if (!selectedGoal) return;

    const txId = `tx-${Date.now()}`;
    const newTx: SavingsTransaction = {
      id: txId,
      goalId: txGoalId,
      date: txDate,
      type: txType,
      amount: txAmount,
      notes: txNotes.trim() || (txType === 'deposit' ? 'Aporte' : 'Retiro')
    };

    // Update both transactions list AND the goal's balance
    setData(prev => {
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.id === txGoalId) {
          const delta = txType === 'deposit' ? txAmount : -txAmount;
          return {
            ...goal,
            balance: Math.max(0, goal.balance + delta)
          };
        }
        return goal;
      });

      return {
        ...prev,
        savingsGoals: updatedGoals,
        savingsTransactions: [newTx, ...prev.savingsTransactions]
      };
    });

    // Reset transaction input
    setTxAmount(100);
    setTxNotes('');
  };

  // Quick Deposit on Card
  const handleQuickDeposit = (goalId: string, amount: number) => {
    const txId = `tx-${Date.now()}`;
    const newTx: SavingsTransaction = {
      id: txId,
      goalId: goalId,
      date: '2026-06-30', // Default current date
      type: 'deposit',
      amount: amount,
      notes: 'Aporte Rápido'
    };

    setData(prev => {
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.id === goalId) {
          return { ...goal, balance: goal.balance + amount };
        }
        return goal;
      });

      return {
        ...prev,
        savingsGoals: updatedGoals,
        savingsTransactions: [newTx, ...prev.savingsTransactions]
      };
    });
  };

  // Delete Transaction
  const handleDeleteTransaction = (tx: SavingsTransaction) => {
    setData(prev => {
      // Revert the transaction's impact on the goal balance
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.id === tx.goalId) {
          const revertDelta = tx.type === 'deposit' ? -tx.amount : tx.amount;
          return {
            ...goal,
            balance: Math.max(0, goal.balance + revertDelta)
          };
        }
        return goal;
      });

      return {
        ...prev,
        savingsGoals: updatedGoals,
        savingsTransactions: prev.savingsTransactions.filter(t => t.id !== tx.id)
      };
    });
  };

  // Helper Calculations for each goal card
  const getGoalMath = (goal: SavingsGoal) => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    
    // Difference in months
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    months = Math.max(1, months);

    const pending = Math.max(0, goal.target - goal.balance);
    const suggestedMonthly = months > 0 ? Math.round((goal.target / months) * 100) / 100 : goal.target;
    const progressPercent = Math.min(100, Math.round((goal.balance / goal.target) * 100));

    return {
      months,
      pending,
      suggestedMonthly,
      progressPercent
    };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="savings-root">
      
      {/* LEFT COLUMN: Summary Widgets & Transaction Logger (xl:col-span-4) */}
      <div className="xl:col-span-4 space-y-6" id="savings-left-column">
        
        {/* Total Progress Widget */}
        <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4" id="savings-progress-widget">
          <div>
            <span className="text-xs font-semibold text-gray-400">Total Ahorrado Acumulado</span>
            <p className="text-3xl font-display font-bold text-gray-800 font-mono mt-1">
              L {totalSaved.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-pink-400 mt-1 font-semibold">Meta de Ahorros Global: L {totalTarget.toLocaleString('es-ES')}</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>Progreso General</span>
              <span className="font-mono">{overallProgressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Transaction Logger */}
        <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm" id="savings-logger-box">
          <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
            Registrar Movimiento de Ahorro
          </h3>

          {data.savingsGoals.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Debes crear al menos una meta de ahorro primero.</p>
          ) : (
            <form onSubmit={handleAddTransaction} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Meta de Destino</label>
                <select
                  value={txGoalId}
                  onChange={e => setTxGoalId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors font-sans"
                >
                  {data.savingsGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo de Operación</label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors font-sans font-semibold text-gray-600"
                  >
                    <option value="deposit">Aporte (+)</option>
                    <option value="withdrawal">Retiro (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Monto (Lempiras)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">L</span>
                    <input
                      type="number"
                      value={txAmount}
                      onChange={e => setTxAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 font-bold font-mono text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Notas / Detalles</label>
                <input
                  type="text"
                  placeholder="Ej. Aporte quincenal, Ajuste, etc."
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 mt-2"
              >
                <Plus className="w-4 h-4" /> Registrar Movimiento
              </button>
            </form>
          )}
        </div>

        {/* Transaction History Log */}
        <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm" id="savings-history-box">
          <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
            Historial de Aportes y Retiros
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data.savingsTransactions.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No se han registrado transacciones.</p>
            ) : (
              data.savingsTransactions.map(tx => {
                const goal = data.savingsGoals.find(g => g.id === tx.goalId);
                const isDeposit = tx.type === 'deposit';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-all text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isDeposit ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {isDeposit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 font-sans">{goal ? goal.name : 'Meta Desconocida'}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.date} • {tx.notes}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${isDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isDeposit ? '+' : '-'}L {tx.amount.toLocaleString('es-ES')}
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx)}
                        className="text-gray-300 hover:text-rose-500 p-1"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Savings Cards Grid (xl:col-span-8) */}
      <div className="xl:col-span-8 space-y-6" id="savings-right-column">
        
        {/* Active Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="savings-cards-grid">
          {data.savingsGoals.map(goal => {
            const math = getGoalMath(goal);
            return (
              <div 
                key={goal.id} 
                className="bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Accent Color Strip */}
                <div className="h-2" style={{ backgroundColor: goal.color }}></div>

                <div className="p-5 flex-1 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 font-sans">{goal.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{goal.notes || 'Sin descripción.'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-gray-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50/50 transition-colors"
                      title="Eliminar Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Target and Balance KPIs */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50/60 p-3 rounded-xl border border-gray-100 font-mono text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">BALANCE ACTUAL</span>
                      <span className="text-base font-bold text-gray-800" style={{ color: goal.color }}>
                        L {goal.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-l border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold block">OBJETIVO FINAL</span>
                      <span className="text-base font-bold text-gray-700">
                        L {goal.target.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Math Metrics */}
                  <div className="grid grid-cols-2 gap-y-2 text-xs border-b border-gray-50 pb-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">DURACIÓN EN MESES</span>
                        <span className="font-semibold text-gray-700">{math.months} meses</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-gray-100">
                      <Target className="w-4 h-4 text-violet-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">APORTE SUGERIDO</span>
                        <span className="font-semibold text-gray-700 font-mono">L {math.suggestedMonthly.toLocaleString('es-ES')} / mes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <DollarSign className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">PENDIENTE POR AHORRAR</span>
                        <span className="font-bold text-gray-700 font-mono">L {math.pending.toLocaleString('es-ES')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 pl-3 border-l border-gray-100">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">FECHA DE CIERRE</span>
                        <span className="font-semibold text-gray-700 text-[11px] font-mono">{goal.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                      <span>Progreso de la Meta</span>
                      <span className="font-mono">{math.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${math.progressPercent}%`, backgroundColor: goal.color }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Quick deposit Actions footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between gap-2">
                  <span className="text-[10px] text-gray-400 font-bold self-center">APORTE RÁPIDO:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleQuickDeposit(goal.id, 100)}
                      className="px-2.5 py-1 bg-white hover:bg-pink-50 text-pink-600 hover:text-pink-700 font-bold font-mono border border-gray-200 hover:border-pink-200 rounded-lg text-[10px] transition-all shadow-xs"
                    >
                      +L100
                    </button>
                    <button
                      onClick={() => handleQuickDeposit(goal.id, 500)}
                      className="px-2.5 py-1 bg-white hover:bg-pink-50 text-pink-600 hover:text-pink-700 font-bold font-mono border border-gray-200 hover:border-pink-200 rounded-lg text-[10px] transition-all shadow-xs"
                    >
                      +L500
                    </button>
                    <button
                      onClick={() => handleQuickDeposit(goal.id, 1000)}
                      className="px-2.5 py-1 bg-white hover:bg-pink-50 text-pink-600 hover:text-pink-700 font-bold font-mono border border-gray-200 hover:border-pink-200 rounded-lg text-[10px] transition-all shadow-xs"
                    >
                      +L1000
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Goal Form Card */}
          {showAddForm ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-pink-200 p-5 space-y-4">
              <h4 className="text-md font-bold text-gray-800">Añadir Nueva Meta de Ahorro</h4>
              
              <form onSubmit={handleAddGoal} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre de la Meta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Compras Navideñas, Enganche Casa..."
                    value={newGoalName}
                    onChange={e => setNewGoalName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Monto Objetivo (Lempiras)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={newGoalTarget}
                      onChange={e => setNewGoalTarget(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Color Etiqueta</label>
                    <div className="flex gap-1.5 mt-1.5">
                      {['#ec4899', '#d946ef', '#a855f7', '#818cf8', '#fb7185', '#06b6d4'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewGoalColor(c)}
                          className={`w-5 h-5 rounded-full border transition-all ${newGoalColor === c ? 'scale-125 border-gray-800' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      value={newGoalStart}
                      onChange={e => setNewGoalStart(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Fecha de Término</label>
                    <input
                      type="date"
                      required
                      value={newGoalEnd}
                      onChange={e => setNewGoalEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Notas / Propósito</label>
                  <input
                    type="text"
                    placeholder="¿Para qué sirve este fondo?"
                    value={newGoalNotes}
                    onChange={e => setNewGoalNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none focus:border-pink-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Crear Meta
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gray-50 hover:bg-pink-50/10 hover:border-pink-300 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer min-h-[300px]"
            >
              <div className="p-3 bg-pink-100 text-pink-500 rounded-full">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-600">Añadir Nueva Meta de Ahorro</h4>
                <p className="text-xs text-gray-400 mt-1">Crea un propósito personalizado, fija fechas límite y calcula montos mensuales automáticos</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
