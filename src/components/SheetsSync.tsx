/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { SheetsSyncState, BudgetData } from '../types';
import { googleSignIn, logout } from '../utils/auth';
import { createBudgetSpreadsheet, exportToSpreadsheet, importFromSpreadsheet } from '../utils/sheets';
import { Cloud, CloudCheck, CloudLightning, Loader2, LogOut, ExternalLink, Settings, RefreshCw, FileSpreadsheet, Plus } from 'lucide-react';

interface SheetsSyncProps {
  user: User | null;
  setUser: (u: User | null) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  data: BudgetData;
  setData: (updater: BudgetData | ((prev: BudgetData) => BudgetData)) => void;
  syncState: SheetsSyncState;
  setSyncState: (updater: SheetsSyncState | ((prev: SheetsSyncState) => SheetsSyncState)) => void;
  onManualSync: () => Promise<void>;
}

export default function SheetsSync({
  user,
  setUser,
  token,
  setToken,
  data,
  setData,
  syncState,
  setSyncState,
  onManualSync
}: SheetsSyncProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [inputSpreadsheetId, setInputSpreadsheetId] = useState('');
  const [sheetTitle, setSheetTitle] = useState('Mi Presupuesto Familiar - 2026');

  // Handle Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setSyncState(prev => ({ ...prev, errorMessage: null }));
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: err.message || 'Error al autenticar con Google'
      }));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSyncState({
        spreadsheetId: null,
        spreadsheetUrl: null,
        lastSynced: null,
        syncStatus: 'idle',
        errorMessage: null
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Create New Google Sheets
  const handleCreateSheet = async () => {
    if (!token) return;
    setIsProvisioning(true);
    setSyncState(prev => ({ ...prev, syncStatus: 'syncing', errorMessage: null }));
    try {
      const { id, url } = await createBudgetSpreadsheet(token, sheetTitle, data);
      setSyncState({
        spreadsheetId: id,
        spreadsheetUrl: url,
        lastSynced: new Date().toLocaleTimeString(),
        syncStatus: 'success',
        errorMessage: null
      });
      // Save configuration in localStorage
      localStorage.setItem('budget_spreadsheet_id', id);
      localStorage.setItem('budget_spreadsheet_url', url);
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: err.message || 'No se pudo crear el archivo en Google Drive.'
      }));
    } finally {
      setIsProvisioning(false);
    }
  };

  // Link Existing Spreadsheet
  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inputSpreadsheetId.trim()) return;
    setIsProvisioning(true);
    setSyncState(prev => ({ ...prev, syncStatus: 'syncing', errorMessage: null }));
    try {
      // First try to import from the given ID to see if it is valid
      const importedData = await importFromSpreadsheet(token, inputSpreadsheetId.trim());
      setData(importedData);
      
      const url = `https://docs.google.com/spreadsheets/d/${inputSpreadsheetId.trim()}/edit`;
      setSyncState({
        spreadsheetId: inputSpreadsheetId.trim(),
        spreadsheetUrl: url,
        lastSynced: new Date().toLocaleTimeString(),
        syncStatus: 'success',
        errorMessage: null
      });

      // Persist configuration
      localStorage.setItem('budget_spreadsheet_id', inputSpreadsheetId.trim());
      localStorage.setItem('budget_spreadsheet_url', url);
      setShowConfig(false);
      setInputSpreadsheetId('');
    } catch (err: any) {
      console.error('Error linking existing spreadsheet:', err);
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'ID de hoja de cálculo no válido o no tienes permisos de acceso.'
      }));
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 space-y-4" id="sheets-sync-panel">
      
      {/* Upper Status/User Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            syncState.syncStatus === 'success' ? 'bg-emerald-50 text-emerald-500' :
            syncState.syncStatus === 'syncing' ? 'bg-pink-50 text-pink-500 animate-spin' :
            syncState.syncStatus === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400'
          }`}>
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Sincronización de Google Sheets</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {syncState.spreadsheetId ? (
                <>Conectado a Google Sheets • Activo en tiempo real</>
              ) : (
                <>Almacenando de forma segura de manera local • Conéctate para sincronizar</>
              )}
            </p>
          </div>
        </div>

        {/* Auth Button Logic */}
        <div>
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button text-xs font-semibold py-1.5 px-3 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-pink-200 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Conectar Cuenta Google</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-700">{user.displayName || 'Usuario de Google'}</p>
                <p className="text-[10px] text-gray-400">{user.email}</p>
              </div>
              {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-pink-100" />
              )}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Document Control */}
      {user && (
        <div className="border-t border-gray-50 pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {syncState.spreadsheetId ? (
            <>
              {/* Linked Sheet Status */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-700">Hoja de Cálculo Vinculada</span>
                    <a
                      href={syncState.spreadsheetUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 flex items-center gap-0.5 text-[11px] font-semibold transition-colors"
                    >
                      Abrir en Sheets <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    ID: {syncState.spreadsheetId.slice(0, 10)}... • Sincronizado: {syncState.lastSynced || 'Hace un momento'}
                  </p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onManualSync}
                  disabled={syncState.syncStatus === 'syncing'}
                  className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {syncState.syncStatus === 'syncing' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sincronizar Ahora
                </button>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 rounded-xl transition-colors"
                  title="Ajustes de sincronización"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Setup Spreadsheets actions */
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-pink-50/10 border border-pink-100/30 p-4 rounded-xl">
              <div className="text-center md:text-left space-y-0.5">
                <p className="text-xs font-bold text-gray-700">Comienza a sincronizar con Google Sheets</p>
                <p className="text-[11px] text-gray-400">Crea una plantilla estructurada de presupuesto o vincula una hoja existente.</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={handleCreateSheet}
                  disabled={isProvisioning}
                  className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isProvisioning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Crear Nueva Hoja
                </button>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vincular Existente (ID)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced configuration slide-down panel */}
      {showConfig && user && (
        <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-4 mt-3 space-y-4 animate-fade-in text-xs text-gray-600">
          <h4 className="font-bold text-gray-800">Ajustes Avanzados de Google Sheets</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create form naming */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre del archivo nuevo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={e => setSheetTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-300"
                />
                <button
                  onClick={handleCreateSheet}
                  disabled={isProvisioning}
                  className="px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold rounded-lg transition-colors"
                >
                  Crear
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Creará el archivo con las pestañas de Ingresos, Egresos y Ahorro en tu Google Drive.</p>
            </div>

            {/* Link Existing ID */}
            <form onSubmit={handleLinkExisting} className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Vincular ID de Hoja Existente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID de la Hoja de Cálculo..."
                  value={inputSpreadsheetId}
                  onChange={e => setInputSpreadsheetId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-300 font-mono text-[10px]"
                />
                <button
                  type="submit"
                  disabled={isProvisioning || !inputSpreadsheetId.trim()}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Vincular
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Puedes copiar el ID desde el enlace de tu navegador: /spreadsheets/d/<b>[ESTE_ID]</b>/edit</p>
            </form>
          </div>
        </div>
      )}

      {/* Error Alert Display */}
      {syncState.errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <CloudLightning className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-medium">{syncState.errorMessage}</span>
        </div>
      )}
    </div>
  );
}
