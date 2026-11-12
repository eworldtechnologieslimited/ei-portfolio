-- cv-rsvp-setup.sql  (idempotent) — CV requests, event RSVPs, storage buckets
create table if not exists cv_requests(
  id uuid primary key default gen_random_uuid(),
  cv_type text, cv_label text, requester_name text, organisation text,
  email text not null, reason text, reference text unique,
  status text default 'pending', created_at timestamptz default now(),
  reviewed_at timestamptz, downloaded_at timestamptz);
alter table cv_requests add column if not exists downloaded_at timestamptz;
alter table cv_requests add column if not exists reviewed_at timestamptz;

create table if not exists event_rsvps(
  id uuid primary key default gen_random_uuid(),
  event_name text not null, name text, email text not null,
  status text default 'going', created_at timestamptz default now(),
  unique(event_name,email));

alter table cv_requests enable row level security;
alter table event_rsvps enable row level security;
drop policy if exists "anon insert cv_requests" on cv_requests;
create policy "anon insert cv_requests" on cv_requests for insert to anon with check (status='pending');
drop policy if exists "anon insert event_rsvps" on event_rsvps;
create policy "anon insert event_rsvps" on event_rsvps for insert to anon with check (true);
-- NOTE: the admin panel currently reads/updates these with the anon key, so it needs
-- the policies below until admin moves to Supabase Auth (see SECURITY note in CLAUDE.md).
drop policy if exists "admin_anon_all cv_requests" on cv_requests;
create policy "admin_anon_all cv_requests" on cv_requests for all to anon using (true) with check (true);
drop policy if exists "admin_anon_all event_rsvps" on event_rsvps;
create policy "admin_anon_all event_rsvps" on event_rsvps for all to anon using (true) with check (true);

insert into storage.buckets(id,name,public) values('cv-files','cv-files',false) on conflict (id) do nothing;
insert into storage.buckets(id,name,public) values('site-media','site-media',true) on conflict (id) do nothing;
