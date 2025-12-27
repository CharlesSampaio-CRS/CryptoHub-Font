import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useAlerts } from '../contexts/AlertsContext';
import { TokenAlert } from '../types/alerts';
import { CreateAlertModal } from './create-alert-modal';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function AlertsManager() {
  const { alerts, toggleAlert, deleteAlert } = useAlerts();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<TokenAlert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<TokenAlert | null>(null);

  const handleEdit = (alert: TokenAlert) => {
    setEditingAlert(alert);
    setCreateModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingAlert) {
      await deleteAlert(deletingAlert.id);
      setDeletingAlert(null);
    }
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    // Aguarda um pouco antes de limpar o alerta em edição
    setTimeout(() => setEditingAlert(null), 300);
  };

  const formatAlertDetails = (alert: TokenAlert): string => {
    const typeText = alert.alertType === 'percentage' ? 'Variação' : 'Preço';
    const conditionText = alert.condition === 'above' ? 'acima de' : 'abaixo de';
    const valueText = alert.alertType === 'percentage'
      ? `${alert.value}%`
      : `$${alert.value.toLocaleString()}`;
    
    return `${typeText} ${conditionText} ${valueText}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔔 Alertas de Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seus alertas personalizados de variação e preço
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          + Novo Alerta
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Alertas</CardDescription>
            <CardTitle className="text-3xl">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas Ativos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {alerts.filter(a => a.enabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas Desativados</CardDescription>
            <CardTitle className="text-3xl text-gray-400">
              {alerts.filter(a => !a.enabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-xl font-semibold mb-2">Nenhum alerta configurado</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Crie seu primeiro alerta para ser notificado quando um token atingir
                determinada variação percentual ou preço.
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                Criar Primeiro Alerta
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={!alert.enabled ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Info do Alerta */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{alert.symbol}</h3>
                      {alert.exchange && (
                        <Badge variant="outline">{alert.exchange}</Badge>
                      )}
                      {!alert.exchange && (
                        <Badge variant="secondary">Todas exchanges</Badge>
                      )}
                      <Badge
                        variant={
                          alert.alertType === 'percentage' ? 'default' : 'secondary'
                        }
                      >
                        {alert.alertType === 'percentage' ? '📊 %' : '💰 $'}
                      </Badge>
                      <Badge
                        variant={alert.condition === 'above' ? 'default' : 'destructive'}
                      >
                        {alert.condition === 'above' ? '📈 Acima' : '📉 Abaixo'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatAlertDetails(alert)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Criado: {formatDate(alert.createdAt)}
                      </span>
                      {alert.lastTriggered && (
                        <span className="text-orange-600 dark:text-orange-400">
                          ⚡ Último disparo: {formatDate(alert.lastTriggered)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {/* Toggle On/Off */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {alert.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Botão Editar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      ✏️
                    </Button>

                    {/* Botão Excluir */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingAlert(alert)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criar/Editar */}
      <CreateAlertModal
        open={createModalOpen}
        onOpenChange={handleModalClose}
        editAlert={editingAlert}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!deletingAlert}
        onOpenChange={() => setDeletingAlert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Alerta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o alerta de{' '}
              <strong>{deletingAlert?.symbol}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
