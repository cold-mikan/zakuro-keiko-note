create table if not exists public.rooms (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  role text not null,
  character text,
  team text not null,
  memo text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.rehearsals (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  place text not null,
  memo text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.rehearsals
  add column if not exists event_type text not null default '稽古日';

alter table public.rehearsals
  add column if not exists rehearsal_team text not null default '共通';

alter table public.rehearsals
  add column if not exists selected_scene_ids text[] not null default '{}';

create table if not exists public.scenes (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  title text not null,
  required_characters text[] not null default '{}',
  memo text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.scenes
  add column if not exists rehearsal_count integer not null default 0;

alter table public.scenes
  add column if not exists team_a_count integer not null default 0;

alter table public.scenes
  add column if not exists team_b_count integer not null default 0;

create table if not exists public.attendances (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  rehearsal_id text not null references public.rehearsals(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  status text not null,
  arrival_time text,
  leave_time text,
  note text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (room_id, rehearsal_id, member_id)
);

create table if not exists public.edit_logs (
  id bigserial primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  table_name text not null,
  record_id text not null,
  action text not null,
  changed_by text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id bigserial primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  rehearsal_id text not null references public.rehearsals(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  unique (room_id, rehearsal_id, member_id, kind)
);

create table if not exists public.schedule_polls (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  title text not null,
  description text,
  is_closed boolean not null default false,
  confirmed_option_id text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_poll_options (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  poll_id text not null references public.schedule_polls(id) on delete cascade,
  candidate_date date not null,
  start_time time not null,
  end_time time not null,
  memo text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_poll_participants (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  poll_id text not null references public.schedule_polls(id) on delete cascade,
  member_name text not null,
  comment text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (room_id, poll_id, member_name)
);

create table if not exists public.schedule_poll_responses (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  poll_id text not null references public.schedule_polls(id) on delete cascade,
  option_id text not null references public.schedule_poll_options(id) on delete cascade,
  participant_id text not null references public.schedule_poll_participants(id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (room_id, poll_id, option_id, participant_id)
);

insert into public.rooms (id, name)
values ('zakuro-keiko', '10月公演 ザクロ 稽古管理')
on conflict (id) do nothing;

alter table public.rooms enable row level security;
alter table public.members enable row level security;
alter table public.rehearsals enable row level security;
alter table public.scenes enable row level security;
alter table public.attendances enable row level security;
alter table public.edit_logs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_logs enable row level security;
alter table public.schedule_polls enable row level security;
alter table public.schedule_poll_options enable row level security;
alter table public.schedule_poll_participants enable row level security;
alter table public.schedule_poll_responses enable row level security;

drop policy if exists "rooms can be read by shared users" on public.rooms;
drop policy if exists "rooms can be inserted by shared users" on public.rooms;
drop policy if exists "rooms can be updated by shared users" on public.rooms;
drop policy if exists "members can be read by shared users" on public.members;
drop policy if exists "rehearsals can be read by shared users" on public.rehearsals;
drop policy if exists "scenes can be read by shared users" on public.scenes;
drop policy if exists "attendances can be read by shared users" on public.attendances;
drop policy if exists "members can be inserted by shared users" on public.members;
drop policy if exists "rehearsals can be inserted by shared users" on public.rehearsals;
drop policy if exists "scenes can be inserted by shared users" on public.scenes;
drop policy if exists "attendances can be inserted by shared users" on public.attendances;
drop policy if exists "members can be updated by shared users" on public.members;
drop policy if exists "rehearsals can be updated by shared users" on public.rehearsals;
drop policy if exists "scenes can be updated by shared users" on public.scenes;
drop policy if exists "attendances can be updated by shared users" on public.attendances;
drop policy if exists "members can be deleted by shared users" on public.members;
drop policy if exists "rehearsals can be deleted by shared users" on public.rehearsals;
drop policy if exists "attendances can be deleted by shared users" on public.attendances;
drop policy if exists "edit logs can be inserted by shared users" on public.edit_logs;
drop policy if exists "edit logs can be read by shared users" on public.edit_logs;
drop policy if exists "schedule polls can be read by shared users" on public.schedule_polls;
drop policy if exists "schedule poll options can be read by shared users" on public.schedule_poll_options;
drop policy if exists "schedule poll participants can be read by shared users" on public.schedule_poll_participants;
drop policy if exists "schedule poll responses can be read by shared users" on public.schedule_poll_responses;
drop policy if exists "schedule polls can be inserted by shared users" on public.schedule_polls;
drop policy if exists "schedule poll options can be inserted by shared users" on public.schedule_poll_options;
drop policy if exists "schedule poll participants can be inserted by shared users" on public.schedule_poll_participants;
drop policy if exists "schedule poll responses can be inserted by shared users" on public.schedule_poll_responses;
drop policy if exists "schedule polls can be updated by shared users" on public.schedule_polls;
drop policy if exists "schedule poll options can be updated by shared users" on public.schedule_poll_options;
drop policy if exists "schedule poll participants can be updated by shared users" on public.schedule_poll_participants;
drop policy if exists "schedule poll responses can be updated by shared users" on public.schedule_poll_responses;
drop policy if exists "schedule polls can be deleted by shared users" on public.schedule_polls;
drop policy if exists "schedule poll options can be deleted by shared users" on public.schedule_poll_options;

create policy "rooms can be read by shared users" on public.rooms
  for select to anon using (true);

create policy "rooms can be inserted by shared users" on public.rooms
  for insert to anon with check (true);

create policy "rooms can be updated by shared users" on public.rooms
  for update to anon using (true) with check (true);

create policy "members can be read by shared users" on public.members
  for select to anon using (true);

create policy "rehearsals can be read by shared users" on public.rehearsals
  for select to anon using (true);

create policy "scenes can be read by shared users" on public.scenes
  for select to anon using (true);

create policy "attendances can be read by shared users" on public.attendances
  for select to anon using (true);

create policy "members can be inserted by shared users" on public.members
  for insert to anon with check (true);

create policy "rehearsals can be inserted by shared users" on public.rehearsals
  for insert to anon with check (true);

create policy "scenes can be inserted by shared users" on public.scenes
  for insert to anon with check (true);

create policy "attendances can be inserted by shared users" on public.attendances
  for insert to anon with check (true);

create policy "members can be updated by shared users" on public.members
  for update to anon using (true) with check (true);

create policy "rehearsals can be updated by shared users" on public.rehearsals
  for update to anon using (true) with check (true);

create policy "scenes can be updated by shared users" on public.scenes
  for update to anon using (true) with check (true);

create policy "attendances can be updated by shared users" on public.attendances
  for update to anon using (true) with check (true);

create policy "members can be deleted by shared users" on public.members
  for delete to anon using (true);

create policy "rehearsals can be deleted by shared users" on public.rehearsals
  for delete to anon using (true);

create policy "attendances can be deleted by shared users" on public.attendances
  for delete to anon using (true);

create policy "edit logs can be inserted by shared users" on public.edit_logs
  for insert to anon with check (true);

create policy "edit logs can be read by shared users" on public.edit_logs
  for select to anon using (true);

create policy "schedule polls can be read by shared users" on public.schedule_polls
  for select to anon using (true);

create policy "schedule poll options can be read by shared users" on public.schedule_poll_options
  for select to anon using (true);

create policy "schedule poll participants can be read by shared users" on public.schedule_poll_participants
  for select to anon using (true);

create policy "schedule poll responses can be read by shared users" on public.schedule_poll_responses
  for select to anon using (true);

create policy "schedule polls can be inserted by shared users" on public.schedule_polls
  for insert to anon with check (true);

create policy "schedule poll options can be inserted by shared users" on public.schedule_poll_options
  for insert to anon with check (true);

create policy "schedule poll participants can be inserted by shared users" on public.schedule_poll_participants
  for insert to anon with check (true);

create policy "schedule poll responses can be inserted by shared users" on public.schedule_poll_responses
  for insert to anon with check (true);

create policy "schedule polls can be updated by shared users" on public.schedule_polls
  for update to anon using (true) with check (true);

create policy "schedule poll options can be updated by shared users" on public.schedule_poll_options
  for update to anon using (true) with check (true);

create policy "schedule poll participants can be updated by shared users" on public.schedule_poll_participants
  for update to anon using (true) with check (true);

create policy "schedule poll responses can be updated by shared users" on public.schedule_poll_responses
  for update to anon using (true) with check (true);

create policy "schedule polls can be deleted by shared users" on public.schedule_polls
  for delete to anon using (true);

create policy "schedule poll options can be deleted by shared users" on public.schedule_poll_options
  for delete to anon using (true);

grant usage on schema public to anon;
grant select, insert, update on public.rooms to anon;
grant select, insert, update on public.members to anon;
grant select, insert, update on public.rehearsals to anon;
grant select, insert, update on public.scenes to anon;
grant select, insert, update on public.attendances to anon;
grant select, insert, update, delete on public.schedule_polls to anon;
grant select, insert, update, delete on public.schedule_poll_options to anon;
grant select, insert, update on public.schedule_poll_participants to anon;
grant select, insert, update on public.schedule_poll_responses to anon;
grant delete on public.members to anon;
grant delete on public.rehearsals to anon;
grant delete on public.attendances to anon;
grant select, insert on public.edit_logs to anon;
grant usage, select on sequence public.edit_logs_id_seq to anon;
grant usage on schema public to service_role;
grant select, insert, update on public.rooms to service_role;
grant select, insert, update, delete on public.members to service_role;
grant select, insert, update, delete on public.rehearsals to service_role;
grant select, insert, update on public.scenes to service_role;
grant select, insert, update, delete on public.attendances to service_role;
grant select, insert, update, delete on public.schedule_polls to service_role;
grant select, insert, update, delete on public.schedule_poll_options to service_role;
grant select, insert, update, delete on public.schedule_poll_participants to service_role;
grant select, insert, update, delete on public.schedule_poll_responses to service_role;
grant select, insert on public.edit_logs to service_role;
grant usage, select on sequence public.push_subscriptions_id_seq to service_role;
grant usage, select on sequence public.notification_logs_id_seq to service_role;
grant select, insert, update on public.push_subscriptions to service_role;
grant select, insert on public.notification_logs to service_role;

notify pgrst, 'reload schema';

do $$
begin
  alter publication supabase_realtime add table public.members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rehearsals;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.scenes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.attendances;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedule_polls;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedule_poll_options;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedule_poll_participants;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedule_poll_responses;
exception when duplicate_object then null;
end $$;
