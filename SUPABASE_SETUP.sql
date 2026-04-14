-- Run this SQL in your Supabase SQL editor
-- Go to: supabase.com → your project → SQL Editor → New Query → paste this → Run

create table sessions (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  created_at timestamp with time zone default now()
);

create table matches (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  pair1 text[] not null,
  pair2 text[] not null,
  score1 integer not null,
  score2 integer not null,
  created_at timestamp with time zone default now()
);

-- Allow anyone to read and write (since this is a club app, no login needed)
alter table sessions enable row level security;
alter table matches enable row level security;

create policy "Allow all" on sessions for all using (true) with check (true);
create policy "Allow all" on matches for all using (true) with check (true);
