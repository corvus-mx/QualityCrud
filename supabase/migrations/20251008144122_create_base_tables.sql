/*
  # Create Base Tables for QMS System

  ## New Tables
  
  ### 1. employees
    - `id` (uuid, primary key) - Auto-generated employee ID
    - `name` (text) - Employee name
    - `email` (text, unique, optional) - Employee email
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. workcenters
    - `id` (uuid, primary key) - Workcenter ID
    - `name` (text) - Workcenter name
    - `code` (text, unique) - Workcenter code
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 3. part_numbers
    - `id` (uuid, primary key) - Part number ID
    - `part_number` (text, unique) - Part number code
    - `description` (text) - Part description
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 4. customers
    - `id` (uuid, primary key) - Customer ID
    - `name` (text) - Customer name
    - `code` (text, unique) - Customer code
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 5. inspection_items
    - `id` (uuid, primary key) - Inspection item ID
    - `name` (text) - Inspection item name
    - `description` (text) - Item description
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 6. dmt_records
    - `id` (text, primary key) - DMT ID (user editable)
    - `workcenter_id` (uuid, foreign key) - Reference to workcenters
    - `part_number_id` (uuid, foreign key) - Reference to part_numbers
    - `operation` (text) - Operation description
    - `employee_id` (uuid, foreign key) - Reference to employees
    - `qty` (integer) - Quantity
    - `customer_id` (uuid, foreign key) - Reference to customers
    - `shop_order` (text) - Shop order number
    - `serial_number` (text) - Serial number
    - `inspection_item_id` (uuid, foreign key) - Reference to inspection_items
    - `date` (date) - DMT date
    - `prepared_by_id` (uuid, foreign key) - Reference to employees (preparer)
    - `defect_description` (text) - Defect description
    - `car_type` (text) - CAR type: 'dmt' or 'ndmt'
    - `car_cycle` (integer) - CAR cycle number
    - `car_second_cycle_date` (date) - CAR second cycle date
    - `disposition_approved_date` (date) - Disposition approved date
    - `disposition_approved_by_id` (uuid, foreign key) - Reference to employees
    - `sdr_number` (text) - SDR number
    - `sdr_approve_date` (date) - SDR approve date
    - `dmt_closed` (boolean) - DMT closed status
    - `car_closed_date` (date) - CAR closed date
    - `is_return` (boolean) - Return checkbox
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all data
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workcenters table
CREATE TABLE IF NOT EXISTS workcenters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create part_numbers table
CREATE TABLE IF NOT EXISTS part_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inspection_items table
CREATE TABLE IF NOT EXISTS inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dmt_records table
CREATE TABLE IF NOT EXISTS dmt_records (
  id text PRIMARY KEY,
  workcenter_id uuid REFERENCES workcenters(id),
  part_number_id uuid REFERENCES part_numbers(id),
  operation text DEFAULT '',
  employee_id uuid REFERENCES employees(id),
  qty integer DEFAULT 0,
  customer_id uuid REFERENCES customers(id),
  shop_order text DEFAULT '',
  serial_number text DEFAULT '',
  inspection_item_id uuid REFERENCES inspection_items(id),
  date date DEFAULT CURRENT_DATE,
  prepared_by_id uuid REFERENCES employees(id),
  defect_description text DEFAULT '',
  car_type text DEFAULT 'dmt',
  car_cycle integer DEFAULT 1,
  car_second_cycle_date date,
  disposition_approved_date date,
  disposition_approved_by_id uuid REFERENCES employees(id),
  sdr_number text DEFAULT '',
  sdr_approve_date date,
  dmt_closed boolean DEFAULT false,
  car_closed_date date,
  is_return boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_workcenters_code ON workcenters(code);
CREATE INDEX IF NOT EXISTS idx_part_numbers_part_number ON part_numbers(part_number);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_dmt_records_date ON dmt_records(date);
CREATE INDEX IF NOT EXISTS idx_dmt_records_active ON dmt_records(is_active);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workcenters ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmt_records ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Allow all operations for authenticated users on employees"
  ON employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for workcenters table
CREATE POLICY "Allow all operations for authenticated users on workcenters"
  ON workcenters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for part_numbers table
CREATE POLICY "Allow all operations for authenticated users on part_numbers"
  ON part_numbers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for customers table
CREATE POLICY "Allow all operations for authenticated users on customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for inspection_items table
CREATE POLICY "Allow all operations for authenticated users on inspection_items"
  ON inspection_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for dmt_records table
CREATE POLICY "Allow all operations for authenticated users on dmt_records"
  ON dmt_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read access for reference data (optional - remove if not needed)
CREATE POLICY "Allow public read on employees"
  ON employees FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow public read on workcenters"
  ON workcenters FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow public read on part_numbers"
  ON part_numbers FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow public read on customers"
  ON customers FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow public read on inspection_items"
  ON inspection_items FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow public read on dmt_records"
  ON dmt_records FOR SELECT
  TO anon
  USING (is_active = true);