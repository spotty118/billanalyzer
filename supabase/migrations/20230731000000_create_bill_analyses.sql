
-- Create a table for storing bill analyses
CREATE TABLE IF NOT EXISTS bill_analyses (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(20) NOT NULL,
  billing_period VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on account_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_bill_analyses_account_number ON bill_analyses(account_number);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_bill_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_bill_analyses_updated_at
BEFORE UPDATE ON bill_analyses
FOR EACH ROW
EXECUTE FUNCTION update_bill_analyses_updated_at();

-- Add RLS policies to protect the data
ALTER TABLE bill_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous uploads)
CREATE POLICY bill_analyses_insert_policy
ON bill_analyses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can select their own data
CREATE POLICY bill_analyses_select_policy
ON bill_analyses FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update their own data
CREATE POLICY bill_analyses_update_policy
ON bill_analyses FOR UPDATE
TO authenticated
USING (true);
