-- Add payment_status column to existing profiles table
ALTER TABLE profiles 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN profiles.payment_status IS 'Payment status: pending, paid, or refunded';

-- Update existing records to have 'pending' payment status (they should already be pending due to DEFAULT)
UPDATE profiles SET payment_status = 'pending' WHERE payment_status IS NULL;
