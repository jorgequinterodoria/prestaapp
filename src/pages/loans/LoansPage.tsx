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
import { Loan,  } from '@/types';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';


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
          clientName: loan.clients[0]?.full_name || 'Unknown',
          amount: loan.amount,
          cuote: loan.cuote,
          interestRate: loan.interest_rates[0]?.percentage || 0,
          paymentFrequency: loan.payment_frequencies[0]?.type || 'Unknown',
          startDate: loan.start_date,
          status: loan.status,
          type: loan.type
        }));

        setLoans(mappedLoans);
      } catch (error) {
        toast.error('Error cargando los préstamos');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const handleDeleteLoan = async (loanId: string) => {
    if (window.confirm('Está seguro de borrar este préstamo?')) {
      try {
        const { error } = await supabase
          .from('loans')
          .delete()
          .eq('loan_id', loanId);

        if (error) throw error;

        toast.success('Préstamo eliminado exitosamente!');
        // Optionally, refresh the loans list or remove the deleted loan from state
        setLoans(loans.filter(loan => loan.id !== loanId));
      } catch (error) {
        toast.error('Error eliminando préstamo');
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Préstamos</h1>
        <Button onClick={() => navigate('/loans/create')}>
          Crear Nuevo Préstamo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Fecha de inicio</TableHead>
              <TableHead>Tipo de Préstamo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.clientName}</TableCell>
                <TableCell>${loan.amount.toLocaleString()}</TableCell>
                <TableCell>{loan.interestRate}%</TableCell>
                <TableCell>{loan.cuote}</TableCell>
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
                    Borrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}