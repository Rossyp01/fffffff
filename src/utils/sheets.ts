/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetData, Income, Expense, MonthlyGoal, SavingsGoal, SavingsTransaction } from '../types';

// Google Sheets API Base URL
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Creates a new Spreadsheet in the user's Google Drive with structured worksheets
 */
export async function createBudgetSpreadsheet(
  accessToken: string,
  title: string,
  data: BudgetData
): Promise<{ id: string; url: string }> {
  try {
    const response = await fetch(SHEETS_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        properties: {
          title: title || 'Mi Presupuesto Familiar - 2026',
        },
        sheets: [
          { properties: { title: 'Ingresos' } },
          { properties: { title: 'Egresos' } },
          { properties: { title: 'MetasMensuales' } },
          { properties: { title: 'MetasAhorro' } },
          { properties: { title: 'TransaccionesAhorro' } },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error al crear la hoja: ${response.statusText}. ${errText}`);
    }

    const result = await response.json();
    const spreadsheetId = result.spreadsheetId;
    const spreadsheetUrl = result.spreadsheetUrl;

    // After creating, export current data to populate it immediately
    await exportToSpreadsheet(accessToken, spreadsheetId, data);

    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error in createBudgetSpreadsheet:', error);
    throw error;
  }
}

/**
 * Pushes all budget data to an existing Google Spreadsheet
 */
export async function exportToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: BudgetData
): Promise<void> {
  try {
    // 1. Format Income
    const incomeHeaders = ['ID', 'Concepto', 'Fecha', 'Origen', 'Presupuestado', 'Real', 'Mes'];
    const incomeRows = data.incomes.map(inc => [
      inc.id,
      inc.concept,
      inc.date,
      inc.source,
      inc.budgeted,
      inc.actual,
      inc.month
    ]);
    const incomeValues = [incomeHeaders, ...incomeRows];

    // 2. Format Expenses
    const expenseHeaders = ['ID', 'Concepto', 'Fecha', 'Tipo', 'Categoría', 'Presupuestado', 'Real', 'Pagado', 'Mes'];
    const expenseRows = data.expenses.map(exp => [
      exp.id,
      exp.concept,
      exp.date,
      exp.type,
      exp.category,
      exp.budgeted,
      exp.actual,
      exp.cleared ? 'SÍ' : 'NO',
      exp.month
    ]);
    const expenseValues = [expenseHeaders, ...expenseRows];

    // 3. Format Monthly Goals
    const goalHeaders = ['ID', 'Objetivo', 'Completado', 'Mes'];
    const goalRows = data.monthlyGoals.map(g => [
      g.id,
      g.text,
      g.completed ? 'SÍ' : 'NO',
      g.month
    ]);
    const goalValues = [goalHeaders, ...goalRows];

    // 4. Format Savings Goals
    const savingsHeaders = ['ID', 'Nombre', 'Meta', 'Balance', 'FechaInicio', 'FechaFin', 'Color', 'Notas'];
    const savingsRows = data.savingsGoals.map(sg => [
      sg.id,
      sg.name,
      sg.target,
      sg.balance,
      sg.startDate,
      sg.endDate,
      sg.color,
      sg.notes
    ]);
    const savingsValues = [savingsHeaders, ...savingsRows];

    // 5. Format Savings Transactions
    const txHeaders = ['ID', 'GoalID', 'Fecha', 'Tipo', 'Monto', 'Notas'];
    const txRows = data.savingsTransactions.map(tx => [
      tx.id,
      tx.goalId,
      tx.date,
      tx.type,
      tx.amount,
      tx.notes
    ]);
    const txValues = [txHeaders, ...txRows];

    // Build batch update body
    const body = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Ingresos!A1:G1000', values: incomeValues },
        { range: 'Egresos!A1:I2000', values: expenseValues },
        { range: 'MetasMensuales!A1:D500', values: goalValues },
        { range: 'MetasAhorro!A1:H100', values: savingsValues },
        { range: 'TransaccionesAhorro!A1:F1000', values: txValues }
      ]
    };

    // First, let's clear existing ranges to ensure deleted records don't linger
    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchClear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ranges: [
          'Ingresos!A1:G1000',
          'Egresos!A1:I2000',
          'MetasMensuales!A1:D500',
          'MetasAhorro!A1:H100',
          'TransaccionesAhorro!A1:F1000'
        ]
      })
    });

    // Write new values
    const response = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error al exportar datos: ${response.statusText}. ${errText}`);
    }
  } catch (error) {
    console.error('Error in exportToSpreadsheet:', error);
    throw error;
  }
}

/**
 * Pulls all budget data from a Google Spreadsheet
 */
export async function importFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<BudgetData> {
  try {
    const ranges = [
      'Ingresos!A1:G1000',
      'Egresos!A1:I2000',
      'MetasMensuales!A1:D500',
      'MetasAhorro!A1:H100',
      'TransaccionesAhorro!A1:F1000'
    ];

    const rangesQuery = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const response = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?${rangesQuery}&valueRenderOption=UNFORMATTED_VALUE`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error al leer datos de la hoja: ${response.statusText}. ${errText}`);
    }

    const result = await response.json();
    const valueRanges = result.valueRanges || [];

    const defaultBudget: BudgetData = {
      incomes: [],
      expenses: [],
      monthlyGoals: [],
      savingsGoals: [],
      savingsTransactions: []
    };

    valueRanges.forEach((vr: any) => {
      const rangeName = vr.range || '';
      const values = vr.values || [];
      if (values.length <= 1) return; // Only header or empty

      const rows = values.slice(1); // skip headers

      if (rangeName.includes('Ingresos')) {
        defaultBudget.incomes = rows.map((row: any) => ({
          id: String(row[0] || ''),
          concept: String(row[1] || ''),
          date: String(row[2] || ''),
          source: String(row[3] || ''),
          budgeted: Number(row[4] || 0),
          actual: Number(row[5] || 0),
          month: String(row[6] || '')
        })).filter((x: any) => x.id);
      } else if (rangeName.includes('Egresos')) {
        defaultBudget.expenses = rows.map((row: any) => ({
          id: String(row[0] || ''),
          concept: String(row[1] || ''),
          date: String(row[2] || ''),
          type: (row[3] === 'Variable' ? 'Variable' : 'Fijo') as 'Fijo' | 'Variable',
          category: String(row[4] || 'Otros'),
          budgeted: Number(row[5] || 0),
          actual: Number(row[6] || 0),
          cleared: row[7] === 'SÍ',
          month: String(row[8] || '')
        })).filter((x: any) => x.id);
      } else if (rangeName.includes('MetasMensuales')) {
        defaultBudget.monthlyGoals = rows.map((row: any) => ({
          id: String(row[0] || ''),
          text: String(row[1] || ''),
          completed: row[2] === 'SÍ',
          month: String(row[3] || '')
        })).filter((x: any) => x.id);
      } else if (rangeName.includes('MetasAhorro')) {
        defaultBudget.savingsGoals = rows.map((row: any) => ({
          id: String(row[0] || ''),
          name: String(row[1] || ''),
          target: Number(row[2] || 0),
          balance: Number(row[3] || 0),
          startDate: String(row[4] || ''),
          endDate: String(row[5] || ''),
          color: String(row[6] || '#ec4899'),
          notes: String(row[7] || '')
        })).filter((x: any) => x.id);
      } else if (rangeName.includes('TransaccionesAhorro')) {
        defaultBudget.savingsTransactions = rows.map((row: any) => ({
          id: String(row[0] || ''),
          goalId: String(row[1] || ''),
          date: String(row[2] || ''),
          type: (row[3] === 'withdrawal' ? 'withdrawal' : 'deposit') as 'deposit' | 'withdrawal',
          amount: Number(row[4] || 0),
          notes: String(row[5] || '')
        })).filter((x: any) => x.id);
      }
    });

    return defaultBudget;
  } catch (error) {
    console.error('Error in importFromSpreadsheet:', error);
    throw error;
  }
}
