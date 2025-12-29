export type AlertType = 'percentage' | 'price';
export type AlertCondition = 'above' | 'below';

export interface TokenAlert {
  id: string;
  symbol: string;
  exchange?: string; // Se vazio, monitora em todas exchanges
  alertType: AlertType;
  condition: AlertCondition;
  value: number; // Porcentagem ou preço absoluto
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string; // Timestamp da última vez que alertou
}

export interface CreateAlertInput {
  symbol: string;
  exchange?: string;
  alertType: AlertType;
  condition: AlertCondition;
  value: number;
}
