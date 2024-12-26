import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function PaymentsListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Load all payments and clients
  useEffect(() => {
    const loadPayments = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('payment_id, amount, payment_date, clients (full_name), loans (amount), notes')
        .order('payment_date', { ascending: false }); // Order by payment date

      if (error) {
        console.error('Error loading payments:', error);
        toast.error('Error loading payments');
      } else {
        setPayments(data);
      }
    };

    const loadClients = async () => {
      const { data, error } = await supabase.from('clients').select('client_id, full_name');
      if (error) {
        console.error('Error loading clients:', error);
        toast.error('Error loading clients');
      } else {
        setClients(data);
      }
    };

    loadPayments();
    loadClients();
  }, []);

  // Filter payments by selected client
  const filteredPayments = selectedClientId
    ? payments.filter(payment => payment.client_id === selectedClientId)
    : payments;

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('payment_id', paymentId);

        if (error) throw error;

        toast.success('Payment deleted successfully');
        // Optionally, refresh the payments list or remove the deleted payment from state
        setPayments(payments.filter(payment => payment.payment_id !== paymentId));
      } catch (error) {
        toast.error('Error deleting payment');
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Lista de pagos</h1>
      <div className="mb-4">
        <Button onClick={() => navigate('/payments/create')}>Create Payment</Button>
      </div>
      <Select onValueChange={setSelectedClientId} defaultValue="">
        <SelectTrigger>
          <SelectValue placeholder="Seleccione Cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients.map(client => (
            <SelectItem key={client.client_id} value={client.client_id}>
              {client.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Loan Amount</TableHead>
            <TableHead>Payment Amount</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.map(payment => (
            <TableRow key={payment.payment_id}>
              <TableCell>{payment.clients.full_name}</TableCell>
              <TableCell>${payment.loans.amount}</TableCell>
              <TableCell>${payment.amount}</TableCell>
              <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
              <TableCell>{payment.notes}</TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => handleDeletePayment(payment.payment_id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 