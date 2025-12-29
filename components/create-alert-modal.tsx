import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAlerts } from '../contexts/AlertsContext';
import { AlertType, AlertCondition, TokenAlert } from '../types/alerts';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbol?: string;
  initialExchange?: string;
  editAlert?: TokenAlert | null;
}

export function CreateAlertModal({
  open,
  onOpenChange,
  initialSymbol = '',
  initialExchange = '',
  editAlert = null,
}: CreateAlertModalProps) {
  const { addAlert, updateAlert } = useAlerts();
  const { t } = useLanguage();

  const [symbol, setSymbol] = useState(initialSymbol);
  const [exchange, setExchange] = useState(initialExchange);
  const [alertType, setAlertType] = useState<AlertType>('percentage');
  const [condition, setCondition] = useState<AlertCondition>('below');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se estiver editando, preenche os campos
  useEffect(() => {
    if (editAlert) {
      setSymbol(editAlert.symbol);
      setExchange(editAlert.exchange || '');
      setAlertType(editAlert.alertType);
      setCondition(editAlert.condition);
      setValue(editAlert.value.toString());
    } else {
      // Se for novo alerta, usa os valores iniciais
      setSymbol(initialSymbol);
      setExchange(initialExchange);
      setAlertType('percentage');
      setCondition('below');
      setValue('');
    }
  }, [editAlert, initialSymbol, initialExchange, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !value) {
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editAlert) {
        // Atualizar alerta existente
        await updateAlert(editAlert.id, {
          symbol,
          exchange: exchange || undefined,
          alertType,
          condition,
          value: numericValue,
        });
      } else {
        // Criar novo alerta
        await addAlert({
          symbol,
          exchange: exchange || undefined,
          alertType,
          condition,
          value: numericValue,
        });
      }

      // Fechar modal e resetar form
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar alerta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSymbol('');
    setExchange('');
    setAlertType('percentage');
    setCondition('below');
    setValue('');
  };

  const handleClose = () => {
    onOpenChange(false);
    if (!editAlert) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editAlert ? '✏️ Editar Alerta' : '🔔 Criar Novo Alerta'}
            </DialogTitle>
            <DialogDescription>
              Configure um alerta personalizado para ser notificado quando um token atingir determinada variação ou preço.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Token Symbol */}
            <div className="grid gap-2">
              <Label htmlFor="symbol">Token (Símbolo) *</Label>
              <Input
                id="symbol"
                placeholder="Ex: BTC, ETH, USDT"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* Exchange (opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="exchange">Exchange (opcional)</Label>
              <Input
                id="exchange"
                placeholder="Deixe vazio para todas exchanges"
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se deixar vazio, o alerta funcionará em todas as exchanges
              </p>
            </div>

            {/* Tipo de Alerta */}
            <div className="grid gap-2">
              <Label htmlFor="alertType">Tipo de Alerta</Label>
              <Select
                value={alertType}
                onValueChange={(value: string) => setAlertType(value as AlertType)}
              >
                <SelectTrigger id="alertType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">📊 Variação Percentual (24h)</SelectItem>
                  <SelectItem value="price">💰 Preço Absoluto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condição */}
            <div className="grid gap-2">
              <Label htmlFor="condition">Condição</Label>
              <Select
                value={condition}
                onValueChange={(value: string) => setCondition(value as AlertCondition)}
              >
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    📈 Acima de (maior ou igual)
                  </SelectItem>
                  <SelectItem value="below">
                    📉 Abaixo de (menor ou igual)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="grid gap-2">
              <Label htmlFor="value">
                Valor *{' '}
                {alertType === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="value"
                type="number"
                step={alertType === 'percentage' ? '0.1' : '0.00000001'}
                placeholder={
                  alertType === 'percentage'
                    ? 'Ex: -5 (para queda de 5%)'
                    : 'Ex: 50000 (para $50,000)'
                }
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {alertType === 'percentage'
                  ? 'Use valores negativos para quedas (ex: -10) e positivos para altas (ex: +10)'
                  : 'Informe o preço em dólares (USD)'}
              </p>
            </div>

            {/* Preview do Alerta */}
            {symbol && value && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">📋 Preview do Alerta:</p>
                <p className="text-muted-foreground">
                  Você será notificado quando <strong>{symbol}</strong>
                  {exchange && ` na ${exchange}`}
                  {' estiver '}
                  <strong>
                    {condition === 'above' ? 'acima de' : 'abaixo de'}
                  </strong>
                  {' '}
                  <strong>
                    {alertType === 'percentage'
                      ? `${value}% de variação`
                      : `$${parseFloat(value).toLocaleString()}`}
                  </strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !symbol || !value}>
              {isSubmitting ? 'Salvando...' : editAlert ? 'Atualizar' : 'Criar Alerta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
