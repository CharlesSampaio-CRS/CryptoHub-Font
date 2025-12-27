import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenAlert, CreateAlertInput } from '../types/alerts';

interface AlertsContextType {
  alerts: TokenAlert[];
  addAlert: (input: CreateAlertInput) => Promise<void>;
  updateAlert: (id: string, updates: Partial<TokenAlert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  getAlertsForToken: (symbol: string, exchange?: string) => TokenAlert[];
  updateLastTriggered: (id: string) => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const STORAGE_KEY = '@cryptohub:token-alerts';

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<TokenAlert[]>([]);

  // Carregar alertas do AsyncStorage ao iniciar
  useEffect(() => {
    loadAlerts();
  }, []);

  // Salvar alertas no AsyncStorage sempre que mudar
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const saveAlerts = async (alertsToSave: TokenAlert[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alertsToSave));
    } catch (error) {
      console.error('Erro ao salvar alertas:', error);
    }
  };

  const addAlert = async (input: CreateAlertInput) => {
    const newAlert: TokenAlert = {
      id: Date.now().toString(),
      ...input,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts(prev => [...prev, newAlert]);
  };

  const updateAlert = async (id: string, updates: Partial<TokenAlert>) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, ...updates } : alert
      )
    );
  };

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const toggleAlert = async (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const getAlertsForToken = (symbol: string, exchange?: string): TokenAlert[] => {
    return alerts.filter(alert => {
      if (!alert.enabled) return false;
      if (alert.symbol !== symbol) return false;
      if (alert.exchange && exchange && alert.exchange !== exchange) return false;
      return true;
    });
  };

  const updateLastTriggered = async (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id
          ? { ...alert, lastTriggered: new Date().toISOString() }
          : alert
      )
    );
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        addAlert,
        updateAlert,
        deleteAlert,
        toggleAlert,
        getAlertsForToken,
        updateLastTriggered,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
