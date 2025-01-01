-- Create payments table
create table if not exists payments (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  currency text not null,
  status text not null,
  customer_email text,
  customer_name text,
  description text,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table payments enable row level security;

-- Create policies
create policy "Enable read access for all users" on payments
  for select using (true);

create policy "Enable insert for authenticated users only" on payments
  for insert with check (auth.role() = 'authenticated');

-- Create indexes
create index if not exists payments_created_at_idx on payments(created_at);
create index if not exists payments_status_idx on payments(status);
create index if not exists payments_customer_email_idx on payments(customer_email);

-- Create function to automatically update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_payments_updated_at
  before update on payments
  for each row
  execute function update_updated_at_column(); 