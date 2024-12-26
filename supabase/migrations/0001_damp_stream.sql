/*
  # Initial Loan Management System Schema

  1. New Tables
    - clients
      - client_id (UUID, primary key)
      - full_name (varchar)
      - phone (varchar)
      - address (text)
      - status (enum)
      - timestamps
    - interest_rates
      - rate_id (UUID, primary key)
      - percentage (decimal)
      - description (text)
      - status (enum)
      - timestamps
    - payment_frequencies
      - frequency_id (UUID, primary key)
      - type (enum)
      - status (enum)
    - loans
      - loan_id (UUID, primary key)
      - client_id (foreign key)
      - amount (decimal)
      - interest_rate_id (foreign key)
      - payment_frequency_id (foreign key)
      - dates and status
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE client_status AS ENUM ('active', 'inactive');
CREATE TYPE rate_status AS ENUM ('active', 'inactive');
CREATE TYPE frequency_type AS ENUM ('weekly', 'biweekly', 'monthly', 'bimonthly');
CREATE TYPE frequency_status AS ENUM ('active', 'inactive');
CREATE TYPE loan_status AS ENUM ('active', 'finished');
CREATE TYPE loan_type AS ENUM ('interest_only', 'fixed_installment');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  status client_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interest_rates table
CREATE TABLE IF NOT EXISTS interest_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  status rate_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_frequencies table
CREATE TABLE IF NOT EXISTS payment_frequencies (
  frequency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type frequency_type NOT NULL,
  status frequency_status DEFAULT 'active'
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(client_id),
  amount DECIMAL(15,2) NOT NULL,
  interest_rate_id UUID NOT NULL REFERENCES interest_rates(rate_id),
  payment_frequency_id UUID NOT NULL REFERENCES payment_frequencies(frequency_id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status loan_status DEFAULT 'active',
  type loan_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read interest_rates"
  ON interest_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read payment_frequencies"
  ON payment_frequencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();