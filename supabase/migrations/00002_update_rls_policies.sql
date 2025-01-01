-- Drop existing policies
drop policy if exists "Enable read access for all users" on payments;
drop policy if exists "Enable insert for authenticated users only" on payments;

-- Create new policies
create policy "Enable read access for authenticated users"
on payments for select
using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users"
on payments for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users"
on payments for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Add user_id column to link payments with users
alter table payments 
add column if not exists user_id uuid references auth.users(id)
default auth.uid(); 