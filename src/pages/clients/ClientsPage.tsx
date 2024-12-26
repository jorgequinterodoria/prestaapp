import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Client } from '@/types';
import { supabase } from '@/lib/supabase';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  // Cargar clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('client_id, full_name, phone, address, status')
          .eq('status', 'active');

        if (error) throw error;

        const mappedClients = data?.map(client => ({
          id: client.client_id,
          name: client.full_name,
          phone: client.phone || '',
          address: client.address || ''
        })) || [];

        setClients(mappedClients);
      } catch (error) {
        toast.error('Error loading clients');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddClient = async () => {
    if (!newClient.fullName) {
      toast.error('Name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name: newClient.fullName,
          phone: newClient.phone,
          address: newClient.address,
          status: 'active'
        })
        .select('client_id, full_name, phone, address')
        .single();

      if (error) throw error;

      setClients([...clients, {
        id: data.client_id,
        name: data.full_name,
        phone: data.phone || '',
        address: data.address || ''
      }]);

      setNewClient({
        fullName: '',
        phone: '',
        address: ''
      });
      setDialogOpen(false);
      toast.success('Client added successfully');
    } catch (error) {
      toast.error('Error adding client');
      console.error('Error:', error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'inactive' })
        .eq('client_id', id);  // Cambiado de id a client_id

      if (error) throw error;

      setClients(clients.filter(client => client.id !== id));
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error('Error deleting client');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Full Name"
                value={newClient.fullName}
                onChange={(e) =>
                  setNewClient({ ...newClient, fullName: e.target.value })
                }
              />
              <Input
                placeholder="Phone"
                value={newClient.phone}
                onChange={(e) =>
                  setNewClient({ ...newClient, phone: e.target.value })
                }
              />
              <Input
                placeholder="Address"
                value={newClient.address}
                onChange={(e) =>
                  setNewClient({ ...newClient, address: e.target.value })
                }
              />
              <Button onClick={handleAddClient}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.address}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    Delete
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