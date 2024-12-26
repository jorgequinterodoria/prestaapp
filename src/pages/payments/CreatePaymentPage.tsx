import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function CreatePaymentPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('clients').select('client_id, full_name');
      if (error) {
        toast.error('Error loading clients');
        console.error('Error fetching clients:', error);
      } else {
        setClients(data);
      }
      setIsLoading(false);
    };
    loadClients();
  }, []);

  // Load loans for the selected client
  useEffect(() => {
    const loadLoans = async () => {
      if (selectedClientId) {
        const { data, error } = await supabase
          .from('loans')
          .select('loan_id, amount, start_date')
          .eq('client_id', selectedClientId);
        if (error) {
          toast.error('Error loading loans');
          console.error(error);
        } else {
          setLoans(data);
        }
      } else {
        setLoans([]);
      }
    };
    loadLoans();
  }, [selectedClientId]);

  const handleSubmit = async () => {
    if (!selectedLoanId || !amount || !paymentDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          loan_id: selectedLoanId,
          client_id: selectedClientId,
          amount: parseFloat(amount),
          payment_date: paymentDate,
          receipt_image: receiptImage ? await uploadImage(receiptImage) : null,
          notes,
        });

      if (error) throw error;

      toast.success('Payment recorded successfully');
      navigate('/payments');
    } catch (error) {
      toast.error('Error recording payment');
      console.error(error);
    }
  };

  const uploadImage = async (file: File) => {
    const { data, error } = await supabase.storage.from('receipts').upload(`payments/${file.name}`, file);
    if (error) {
      toast.error('Error uploading image');
      console.error(error);
      return null;
    }
    return data.Key; // Return the path or URL of the uploaded image
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Record Payment</h1>
      <Select onValueChange={setSelectedClientId}>
        <SelectTrigger>
          <SelectValue placeholder="Select Client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map(client => (
            <SelectItem key={client.client_id} value={client.client_id}>
              {client.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={setSelectedLoanId} disabled={!selectedClientId}>
        <SelectTrigger>
          <SelectValue placeholder="Select Loan" />
        </SelectTrigger>
        <SelectContent>
          {loans.map(loan => (
            <SelectItem key={loan.loan_id} value={loan.loan_id}>
              ${loan.amount} - {new Date(loan.start_date).toLocaleDateString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      <Input type="file" onChange={(e) => setReceiptImage(e.target.files?.[0] || null)} />
      <Input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <Button onClick={handleSubmit}>Submit Payment</Button>
    </div>
  );
} 