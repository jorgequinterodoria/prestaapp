import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const LOAN_TYPES = ['interest_only', 'fixed_installment'] as const;

interface InstallmentPreview {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function CreateLoanPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([]);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [installmentPreviews, setInstallmentPreviews] = useState<InstallmentPreview[]>([]);
  
  const [newLoan, setNewLoan] = useState({
    clientId: '',
    amount: '',
    interestRateId: '',
    paymentFrequencyId: '',
    startDate: '',
    type: '' as typeof LOAN_TYPES[number] | '',
    cuote: '',
    numInstallments: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoading(true);
        const [
          { data: clientsData, error: clientsError },
          { data: periodsData, error: periodsError },
          { data: ratesData, error: ratesError }
        ] = await Promise.all([
          supabase
            .from('clients')
            .select('client_id, full_name')
            .eq('status', 'active'),
          supabase
            .from('payment_frequencies')
            .select('frequency_id, type')
            .eq('status', 'active'),
          supabase
            .from('interest_rates')
            .select('rate_id, percentage')
            .eq('status', 'active')
        ]);

        if (clientsError) throw clientsError;
        if (periodsError) throw periodsError;
        if (ratesError) throw ratesError;

        setClients(clientsData?.map(client => ({
          id: client.client_id,
          name: client.full_name
        })) || []);

        setPaymentPeriods(periodsData?.map(period => ({
          id: period.frequency_id,
          name: period.type
        })) || []);

        setInterestRates(ratesData?.map(rate => ({
          id: rate.rate_id,
          rate: rate.percentage
        })) || []);

      } catch (error) {
        toast.error('Error cargando los datos');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, []);

  // Calcular cuotas cuando cambian los valores
  useEffect(() => {
    if (newLoan.amount && newLoan.interestRateId && newLoan.type) {
      const amount = parseFloat(newLoan.amount);
      const selectedRate = interestRates.find(rate => rate.id === newLoan.interestRateId);
      
      if (selectedRate && !isNaN(amount)) {
        try {
          if (newLoan.type === 'interest_only') {
            const interestCuote = calculateInterestOnlyCuote(amount, selectedRate.rate);
            if (!isNaN(interestCuote)) {
              setNewLoan(prev => ({ ...prev, cuote: interestCuote.toFixed(2) }));
              setInstallmentPreviews([]);
            }
          } else if (newLoan.type === 'fixed_installment' && newLoan.numInstallments) {
            const numInstallments = parseInt(newLoan.numInstallments);
            if (!isNaN(numInstallments) && numInstallments > 0) {
              const installments = calculateFixedInstallments(amount, selectedRate.rate, numInstallments);
              setInstallmentPreviews(installments);
              if (installments.length > 0) {
                setNewLoan(prev => ({ ...prev, cuote: installments[0].payment.toFixed(2) }));
              }
            }
          }
        } catch (error) {
          console.error('Error calculando las cuotas:', error);
        }
      }
    }
  }, [newLoan.amount, newLoan.interestRateId, newLoan.type, newLoan.numInstallments, interestRates]);

  const calculateInterestOnlyCuote = (amount: number, interestRate: number): number => {
    if (isNaN(amount) || isNaN(interestRate)) return 0;
    return (amount * (interestRate / 100));
  };

  const calculateFixedInstallments = (amount: number, interestRate: number, numInstallments: number): InstallmentPreview[] => {
    if (isNaN(amount) || isNaN(interestRate) || isNaN(numInstallments) || numInstallments <= 0) {
      return [];
    }

    const monthlyRate = (interestRate / 100) / 12;
    if (monthlyRate <= 0) return [];

    const denominator = 1 - Math.pow(1 + monthlyRate, -numInstallments);
    if (denominator === 0) return [];

    const fixedPayment = amount * (monthlyRate / denominator);
    
    let remainingBalance = amount;
    const installments: InstallmentPreview[] = [];

    for (let i = 1; i <= numInstallments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = fixedPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      installments.push({
        number: i,
        payment: fixedPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: remainingBalance
      });
    }

    return installments;
  };

  const handleSubmit = async () => {
    if (!newLoan.clientId || !newLoan.amount || !newLoan.interestRateId || 
        !newLoan.paymentFrequencyId || !newLoan.startDate || !newLoan.type || !newLoan.cuote) {
      toast.error('Por favor llene todos los campos requeridos');
      return;
    }

    try {
      const amount = parseFloat(newLoan.amount);
      const cuote = parseFloat(newLoan.cuote);

      const { error } = await supabase
        .from('loans')
        .insert({
          client_id: newLoan.clientId,
          amount: amount,
          interest_rate_id: newLoan.interestRateId,
          payment_frequency_id: newLoan.paymentFrequencyId,
          start_date: newLoan.startDate,
          type: newLoan.type,
          cuote: cuote,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Préstamo creado exitosamente');
      navigate('/loans');
    } catch (error) {
      toast.error('Error creando préstamo');
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Crear Nuevo Préstamo</h1>
        <Button variant="outline" onClick={() => navigate('/loans')}>
          Regresar a Préstamos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Préstamo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              onValueChange={(value) =>
                setNewLoan({ ...newLoan, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione Cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Cantidad"
              value={newLoan.amount}
              onChange={(e) =>
                setNewLoan({ ...newLoan, amount: e.target.value })
              }
            />

            <Select
              onValueChange={(value) =>
                setNewLoan({ ...newLoan, interestRateId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tasa de interés" />
              </SelectTrigger>
              <SelectContent>
                {interestRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id}>
                    {rate.rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setNewLoan({ ...newLoan, paymentFrequencyId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione frecuencia de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => {
                setNewLoan({
                  ...newLoan,
                  type: value as typeof LOAN_TYPES[number],
                  numInstallments: ''
                });
                setInstallmentPreviews([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo de préstamo" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {newLoan.type === 'fixed_installment' && (
              <Input
                type="number"
                placeholder="Número de cuotas"
                value={newLoan.numInstallments}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, numInstallments: e.target.value })
                }
              />
            )}

            <Input
              type="date"
              value={newLoan.startDate}
              onChange={(e) =>
                setNewLoan({ ...newLoan, startDate: e.target.value })
              }
            />

            <Input
              type="number"
              placeholder="Cuota"
              value={newLoan.cuote}
              onChange={(e) =>
                setNewLoan({ ...newLoan, cuote: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/loans')}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Crear Préstamo</Button>
            </div>
          </CardContent>
        </Card>

        {newLoan.type === 'fixed_installment' && installmentPreviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Amortización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">N°</TableHead>
                        <TableHead className="text-right">Cuota</TableHead>
                        <TableHead className="text-right">Capital</TableHead>
                        <TableHead className="text-right">Intereses</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-center">0</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-medium">
                          ${parseFloat(newLoan.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                      </TableRow>
                      {installmentPreviews.map((installment) => (
                        <TableRow key={installment.number}>
                          <TableCell className="text-center">
                            {installment.number}
                          </TableCell>
                          <TableCell className="text-right">
                            ${installment.payment.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            ${installment.principal.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            ${installment.interest.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${installment.balance.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          ${(installmentPreviews[0]?.payment * installmentPreviews.length).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(newLoan.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(installmentPreviews.reduce((sum, inst) => sum + inst.interest, 0)).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 