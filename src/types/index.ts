export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  status?: string;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  interestRate: number;
  paymentFrequency: string;
  startDate: string;
  status: 'active' | 'finished';
  type: 'interest_only' | 'fixed_installment';
  cuote: number;
  numInstallments?: number;
}

export interface PaymentPeriod {
  id: string;
  name: string;
  status?: string;
}

export interface InterestRate {
  id: string;
  rate: number;
  name: string;
} 