-- Access Requests table for approval-based test access
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('pre_test','post_test')),
  pool_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','used')),
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  admin_notes TEXT,
  extensions INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_test_pool ON access_requests(test_type, pool_id);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Basic RLS: authenticated users can read their own; staff/admin can read all
CREATE POLICY "access_requests_read_own" ON access_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "access_requests_insert_own" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow staff/admin to manage (adjust role checks to your setup)
-- If you use a profiles table with user_type, you may replace with a secure function.
GRANT SELECT, INSERT, UPDATE ON access_requests TO authenticated;


