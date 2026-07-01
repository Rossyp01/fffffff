/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { BudgetData, SheetsSyncState } from './types';
import { getInitialBudgetData } from './data/defaultData';
import { initAuth } from './utils/auth';
import { exportToSpreadsheet, importFromSpreadsheet } from './utils/sheets';
import MonthlyView from './components/MonthlyView';
import AnnualSummary from './components/AnnualSummary';
import SavingsGoals from './components/SavingsGoals';
import SheetsSync from './components/SheetsSync';
import { Calendar, BarChart3, PiggyBank, Sparkles, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'presupuesto_sheets_data_v1';

export default function App() {
  const [selectedTab, setSelectedTab] = useState<'month' | 'year' | 'savings'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // Starts in October matching visual guidelines
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize state from local cache or pre-populated template
  const [data, setData] = useState<BudgetData>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached budget data, loading default', e);
      }
    }
    return getInitialBudgetData();
  });

  // Initialize Sheets sync configuration
  const [syncState, setSyncState] = useState<SheetsSyncState>(() => {
    const spreadsheetId = localStorage.getItem('budget_spreadsheet_id');
    const spreadsheetUrl = localStorage.getItem('budget_spreadsheet_url');
    return {
      spreadsheetId,
      spreadsheetUrl,
      lastSynced: null,
      syncStatus: spreadsheetId ? 'idle' : 'idle',
      errorMessage: null
    };
  });

  // Keep local storage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // General sheets sync functions
  const syncWithSheets = useCallback(async (accessToken: string, spreadsheetId: string) => {
    setSyncState(prev => ({ ...prev, syncStatus: 'syncing', errorMessage: null }));
    try {
      // 1. First export current local edits to Google Sheets
      await exportToSpreadsheet(accessToken, spreadsheetId, data);
      
      // 2. Then pull back from Google Sheets to verify and hydrate any updates
      const updatedData = await importFromSpreadsheet(accessToken, spreadsheetId);
      setData(updatedData);

      setSyncState(prev => ({
        ...prev,
        syncStatus: 'success',
        lastSynced: new Date().toLocaleTimeString(),
        errorMessage: null
      }));
    } catch (err: any) {
      console.error('Sync failure:', err);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: err.message || 'Error al conectar con la Hoja de Cálculo. Verifica tu conexión.'
      }));
    }
  }, [data]);

  // Authenticate user on mount and load configurations
  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);

        // Auto-run sync on startup if we already have a spreadsheet ID
        const savedId = localStorage.getItem('budget_spreadsheet_id');
        if (savedId) {
          try {
            setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));
            const latestData = await importFromSpreadsheet(accessToken, savedId);
            setData(latestData);
            setSyncState(prev => ({
              ...prev,
              syncStatus: 'success',
              lastSynced: new Date().toLocaleTimeString(),
              errorMessage: null
            }));
          } catch (err) {
            console.error('Failed initial hydration sync from Google Sheets:', err);
            // Fall back to local data but alert user
            setSyncState(prev => ({
              ...prev,
              syncStatus: 'error',
              errorMessage: 'Sincronización inicial fallida. Usando datos locales.'
            }));
          }
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Debounced Auto-Push Engine (Real-Time Background Sync)
  useEffect(() => {
    if (!token || !syncState.spreadsheetId) return;

    setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));

    const timer = setTimeout(async () => {
      try {
        await exportToSpreadsheet(token, syncState.spreadsheetId!, data);
        setSyncState(prev => ({
          ...prev,
          syncStatus: 'success',
          lastSynced: new Date().toLocaleTimeString(),
          errorMessage: null
        }));
      } catch (err: any) {
        console.error('Auto-sync background error:', err);
        setSyncState(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: 'Error al autoguardar en Google Sheets. Se reintentará al hacer cambios.'
        }));
      }
    }, 4000); // 4 seconds debouncing to save Sheets API quotas

    return () => clearTimeout(timer);
  }, [data, token, syncState.spreadsheetId]);

  // Handle Manual Synchronisation Call
  const handleManualSync = async () => {
    if (!token || !syncState.spreadsheetId) return;
    await syncWithSheets(token, syncState.spreadsheetId);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col antialiased font-sans text-gray-800" id="app-wrapper">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-pink-100/60 sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
                Presupuesto con Google Sheets
              </h1>
              <p className="text-[10px] font-semibold text-pink-500 tracking-wider uppercase">Finanzas Personales de Alta Gama</p>
            </div>
          </div>

          {/* Navigation Tab Selectors */}
          <nav className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50" id="tabs-navigation">
            <button
              onClick={() => setSelectedTab('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'month'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Vista del Mes
            </button>
            <button
              onClick={() => setSelectedTab('year')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'year'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Resumen del Año
            </button>
            <button
              onClick={() => setSelectedTab('savings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'savings'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              Metas de Ahorro
            </button>
          </nav>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="app-content">
        
        {/* Google Sheets Sync Controller Widget */}
        <SheetsSync
          user={user}
          setUser={setUser}
          token={token}
          setToken={setToken}
          data={data}
          setData={setData}
          syncState={syncState}
          setSyncState={setSyncState}
          onManualSync={handleManualSync}
        />

        {/* Sync Status Overlay/Indicator */}
        {syncState.syncStatus === 'syncing' && (
          <div className="fixed bottom-6 right-6 bg-gray-900/90 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg backdrop-blur-md border border-gray-800 animate-pulse z-50">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
            <span>Guardando cambios en tu Google Sheet...</span>
          </div>
        )}

        {/* Selected View Layouts */}
        <div className="animate-fade-in">
          {selectedTab === 'month' && (
            <MonthlyView
              data={data}
              setData={setData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}

          {selectedTab === 'year' && (
            <AnnualSummary
              data={data}
            />
          )}

          {selectedTab === 'savings' && (
            <SavingsGoals
              data={data}
              setData={setData}
            />
          )}
        </div>

      </main>

      {/* Styled Minimalist Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400" id="app-footer">
        <p>© 2026 Presupuesto con Google Sheets • Diseñado para control y liquidez financiera.</p>
      </footer>

    </div>
  );
}
