-- Create profiles table for participant/staff/admin details
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Information
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  ic_number VARCHAR(14),
  
  -- Professional Information
  job_position_id UUID REFERENCES jobs(id),
  job_position_name VARCHAR(255),
  grade VARCHAR(10),
  tempat_bertugas VARCHAR(255),
  
  -- BLS Information
  last_bls_attempt VARCHAR(20), -- 'First Time' or year like '2023'
  
  -- Medical Information
  has_asthma BOOLEAN DEFAULT FALSE,
  has_allergies BOOLEAN DEFAULT FALSE,
  allergies_description TEXT,
  is_pregnant BOOLEAN DEFAULT FALSE,
  pregnancy_weeks INTEGER,
  
  -- User Role and Status
  user_type VARCHAR(20) DEFAULT 'participant' CHECK (user_type IN ('participant', 'staff', 'admin', 'super_admin')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Notes
  notes TEXT,
  
  -- Indexes for better performance
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_ic_number CHECK (ic_number ~* '^[0-9]{12}$' OR ic_number ~* '^[0-9]{6}-[0-9]{2}-[0-9]{4}$'),
  CONSTRAINT valid_phone CHECK (phone_number ~* '^[+]?[0-9\s\-\(\)]{10,20}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_job_position ON profiles(job_position_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'Stores participant, staff, and admin profile information';
COMMENT ON COLUMN profiles.user_type IS 'Type of user: participant, staff, admin, or super_admin';
COMMENT ON COLUMN profiles.status IS 'Current status: pending, approved, rejected, active, or inactive';
COMMENT ON COLUMN profiles.payment_status IS 'Payment status: pending, paid, or refunded';
COMMENT ON COLUMN profiles.last_bls_attempt IS 'Last BLS attempt year or "First Time"';
COMMENT ON COLUMN profiles.has_asthma IS 'Whether the person has asthma';
COMMENT ON COLUMN profiles.has_allergies IS 'Whether the person has allergies';
COMMENT ON COLUMN profiles.allergies_description IS 'Description of allergies if has_allergies is true';
COMMENT ON COLUMN profiles.is_pregnant IS 'Whether the person is pregnant';
COMMENT ON COLUMN profiles.pregnancy_weeks IS 'Number of pregnancy weeks if is_pregnant is true';