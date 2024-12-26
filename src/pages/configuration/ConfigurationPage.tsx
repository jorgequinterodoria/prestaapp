import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PaymentPeriod, InterestRate } from '@/types';
import { supabase } from '@/lib/supabase';

// Definimos los valores permitidos
const FREQUENCY_TYPES = ['weekly', 'biweekly', 'monthly', 'bimonthly'] as const;

export function ConfigurationPage() {
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([]);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [newPeriod, setNewPeriod] = useState({ type: '' });
  const [newRate, setNewRate] = useState({ name: '', rate: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [{ data: periodsData, error: periodsError }, { data: ratesData, error: ratesError }] = 
          await Promise.all([
            supabase
              .from('payment_frequencies')
              .select('frequency_id, type')
              .eq('status', 'active'),
            supabase
              .from('interest_rates')
              .select('rate_id, percentage')
              .eq('status', 'active')
          ]);

        if (periodsError) throw periodsError;
        if (ratesError) throw ratesError;

        const mappedPeriodsData = (periodsData || []).map(period => ({
          id: period.frequency_id,
          name: period.type
        }));

        const mappedRatesData = (ratesData || []).map(rate => ({
          id: rate.rate_id,
          rate: rate.percentage
        }));

        setPaymentPeriods(mappedPeriodsData);
        setInterestRates(mappedRatesData);
      } catch (error) {
        toast.error('Error loading configuration data');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddPeriod = async () => {
    if (!newPeriod.type) {
      toast.error('Please select a frequency type');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_frequencies')
        .insert({
          type: newPeriod.type,
          status: 'active'
        })
        .select('frequency_id, type')
        .single();

      if (error) throw error;

      setPaymentPeriods([...paymentPeriods, {
        id: data.frequency_id,
        name: data.type
      }]);
      setNewPeriod({ type: '' });
      toast.success('Payment frequency added');
    } catch (error) {
      toast.error('Error adding payment frequency');
      console.error('Error:', error);
    }
  };

  const handleAddRate = async () => {
    if (!newRate.rate) {
      toast.error('Please fill the rate field');
      return;
    }

    const rate = parseFloat(newRate.rate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Rate must be a positive number');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('interest_rates')
        .insert({
          percentage: parseFloat(rate.toFixed(1)),
          status: 'active'
        })
        .select('rate_id, percentage')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setInterestRates([...interestRates, {
        id: data.rate_id,
        rate: data.percentage
      }]);
      setNewRate({ name: '', rate: '' });
      toast.success('Interest rate added');
    } catch (error) {
      toast.error('Error adding interest rate');
      console.error('Error:', error);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_frequencies')
        .update({ status: 'inactive' })
        .eq('frequency_id', id);

      if (error) throw error;

      setPaymentPeriods(paymentPeriods.filter((p) => p.id !== id));
      toast.success('Payment frequency deleted');
    } catch (error) {
      toast.error('Error deleting payment frequency');
      console.error('Error:', error);
    }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interest_rates')
        .update({ status: 'inactive' })
        .eq('rate_id', id);

      if (error) throw error;

      setInterestRates(interestRates.filter((r) => r.id !== id));
      toast.success('Interest rate deleted');
    } catch (error) {
      toast.error('Error deleting interest rate');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Frequencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={newPeriod.type}
                    onValueChange={(value) =>
                      setNewPeriod({ type: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddPeriod}>Add</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentPeriods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          {period.name.charAt(0).toUpperCase() + period.name.slice(1)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePeriod(period.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interest Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rate (%)"
                    type="number"
                    step="0.1"
                    value={newRate.rate}
                    onChange={(e) =>
                      setNewRate({ ...newRate, rate: e.target.value })
                    }
                  />
                  <Button onClick={handleAddRate}>Add</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rate (%)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>{rate.rate}%</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRate(rate.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}