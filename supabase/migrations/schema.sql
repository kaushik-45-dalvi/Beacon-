-- Create table for monitored domains
create table if not exists monitored_domains (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Stores the Clerk user ID
  domain text not null,
  issuer text,
  issuer_org text,
  subject text,
  issued_at timestamp with time zone,
  expires_at timestamp with time zone,
  days_remaining integer,
  status text check (status in ('green', 'yellow', 'red')),
  chain_complete boolean,
  ocsp_status text check (ocsp_status in ('good', 'revoked', 'unknown')),
  key_type text,
  key_size integer,
  signature_algorithm text,
  serial_number text,
  fingerprint_sha256 text,
  san_domains text[],
  chain jsonb,
  history jsonb,
  last_checked_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Alert preferences
  alert_days integer[] default array[30, 7, 1],
  alert_channels text[] default array['email'],
  slack_url text,
  webhook_url text,
  
  unique(user_id, domain)
);

-- Index for querying domains by user_id
create index if not exists idx_monitored_domains_user on monitored_domains(user_id);
