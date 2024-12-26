import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { toast } from 'sonner';
import { Loan, Client, PaymentPeriod, InterestRate } from '@/types';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// Definir los tipos de préstamo permitidos
const LOAN_TYPES = ['interest_only', 'fixed_installment'] as const;

interface InstallmentPreview {
  number: number;
  payment: number;      // Cuota fija
  principal: number;    // Abono a capital
  interest: number;     // Intereses
  balance: number;      // Saldo restante
}

export function LoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar préstamos
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('loans')
          .select(`
            loan_id,
            client_id,
            clients (full_name),
            amount,
            cuote,
            interest_rate_id,
            interest_rates (percentage),
            payment_frequency_id,
            payment_frequencies (type),
            start_date,
            status,
            type
          `)
          .eq('status', 'active');

        if (error) throw error;

        const mappedLoans = (data || []).map(loan => ({
          id: loan.loan_id,
          clientId: loan.client_id,
          clientName: loan.clients.full_name,
          amount: loan.amount,
          cuote:loan.cuote,
          interestRate: loan.interest_rates.percentage,
          paymentFrequency: loan.payment_frequencies.type,
          startDate: loan.start_date,
          status: loan.status,
          type: loan.type
        }));

        setLoans(mappedLoans);
      } catch (error) {
        toast.error('Error loading loans');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);



  

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <Button onClick={() => navigate('/loans/create')}>
          Create New Loan
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Interest Rate</TableHead>
            <TableHead>Cuote</TableHead>
            <TableHead>Payment Period</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>{loan.clientName}</TableCell>
              <TableCell>${loan.amount.toLocaleString()}</TableCell>
              <TableCell>{loan.interestRate}%</TableCell>
              <TableCell>{loan.cuote}</TableCell>
              <TableCell>{loan.paymentFrequency}</TableCell>
              <TableCell>
                {new Date(loan.startDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{loan.type.replace('_', ' ').toUpperCase()}</TableCell>
              <TableCell>{loan.status}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteLoan(loan.id)}
                >
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