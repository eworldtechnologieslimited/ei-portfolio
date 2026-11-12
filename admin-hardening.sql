-- admin-hardening.sql (idempotent) — run AFTER seed-admin.sql has created your super admin.
-- Closes: anonymous callers could create admins / reset passwords / edit or delete admin_users via the public anon key.
-- Every privileged function now verifies an ACTIVE SUPER ADMIN's username+password inside Postgres.
create extension if not exists pgcrypto;

create or replace function _is_super(p_u text, p_p text) returns boolean
language plpgsql security definer set search_path=public,extensions as $$
declare ok boolean;
begin
  select true into ok from admin_users a
   where a.username=p_u and a.status='active' and a.role='super_admin'
     and a.password_hash=crypt(p_p,a.password_hash);
  if ok is null then perform pg_sleep(0.6); return false; end if;
  return true;
end $$;
revoke all on function _is_super(text,text) from public, anon, authenticated;

-- slow down guessing on the login RPC
create or replace function verify_admin_login(p_username text,p_password text)
returns table(id bigint,username text,display_name text,role text,permissions jsonb,status text)
language plpgsql security definer set search_path=public,extensions as $$
begin
  return query select a.id,a.username,a.display_name,a.role,a.permissions,a.status from admin_users a
   where a.username=p_username and a.password_hash=crypt(p_password,a.password_hash) and a.status='active';
  if found then update admin_users set last_login=now() where admin_users.username=p_username;
  else perform pg_sleep(0.6); end if;
end $$;
grant execute on function verify_admin_login(text,text) to anon;

drop function if exists create_admin_user(text,text,text,text,text,jsonb);
drop function if exists admin_reset_password(bigint,text);

create or replace function create_admin_user(p_actor_user text,p_actor_pass text,p_username text,p_password text,p_display_name text,p_email text,p_role text,p_permissions jsonb)
returns bigint language plpgsql security definer set search_path=public,extensions as $$
declare nid bigint;
begin
  if not _is_super(p_actor_user,p_actor_pass) then raise exception 'not authorised'; end if;
  insert into admin_users(username,password_hash,display_name,email,role,permissions)
  values(p_username,crypt(p_password,gen_salt('bf')),p_display_name,p_email,p_role,p_permissions) returning id into nid;
  return nid;
end $$;

create or replace function admin_reset_password(p_actor_user text,p_actor_pass text,p_user_id bigint,p_new_password text)
returns void language plpgsql security definer set search_path=public,extensions as $$
begin
  if not _is_super(p_actor_user,p_actor_pass) then raise exception 'not authorised'; end if;
  update admin_users set password_hash=crypt(p_new_password,gen_salt('bf')) where id=p_user_id;
end $$;

create or replace function admin_update_user(p_actor_user text,p_actor_pass text,p_user_id bigint,p_username text,p_display_name text,p_email text,p_role text,p_permissions jsonb,p_status text)
returns void language plpgsql security definer set search_path=public,extensions as $$
begin
  if not _is_super(p_actor_user,p_actor_pass) then raise exception 'not authorised'; end if;
  update admin_users set username=coalesce(p_username,username),display_name=coalesce(p_display_name,display_name),
    email=p_email,role=coalesce(p_role,role),permissions=coalesce(p_permissions,permissions),status=coalesce(p_status,status)
  where id=p_user_id;
end $$;

create or replace function admin_delete_user(p_actor_user text,p_actor_pass text,p_user_id bigint)
returns void language plpgsql security definer set search_path=public,extensions as $$
begin
  if not _is_super(p_actor_user,p_actor_pass) then raise exception 'not authorised'; end if;
  if (select role from admin_users where id=p_user_id)='super_admin'
     and (select count(*) from admin_users where role='super_admin' and status='active')<=1
  then raise exception 'cannot delete the last super admin'; end if;
  delete from admin_users where id=p_user_id;
end $$;

create or replace function admin_list_users(p_actor_user text,p_actor_pass text)
returns table(id bigint,username text,display_name text,email text,role text,permissions jsonb,status text,created_at timestamptz,last_login timestamptz)
language plpgsql security definer set search_path=public,extensions as $$
begin
  if not _is_super(p_actor_user,p_actor_pass) then raise exception 'not authorised'; end if;
  return query select a.id,a.username,a.display_name,a.email,a.role,a.permissions,a.status,a.created_at,a.last_login from admin_users a order by a.created_at;
end $$;

grant execute on function create_admin_user(text,text,text,text,text,text,text,jsonb),
  admin_reset_password(text,text,bigint,text), admin_update_user(text,text,bigint,text,text,text,text,jsonb,text),
  admin_delete_user(text,text,bigint), admin_list_users(text,text) to anon;

-- the safe view is no longer reachable by anon at all
revoke all on admin_users_safe from anon, authenticated;

-- ── PII tables: the public site may only INSERT. Reads/updates/deletes go through /api/admin-proxy (service key). ──
do $$ declare t text; r record; begin
  foreach t in array array['cv_requests','event_rsvps','contact_submissions','newsletter_subscribers'] loop
    if to_regclass('public.'||t) is not null then
      for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
        execute format('drop policy %I on %I',r.policyname,t);
      end loop;
      execute format('alter table %I enable row level security',t);
      execute format('revoke all on %I from anon, authenticated',t);
      execute format('grant insert on %I to anon',t);
      execute format('create policy "public insert" on %I for insert to anon with check (true)',t);
    end if;
  end loop;
end $$;

-- public RSVP head-count (for capacity) without exposing rows
create or replace function rsvp_count(p_event text) returns integer
language sql security definer set search_path=public as $$ select count(*)::int from event_rsvps where event_name=p_event $$;
grant execute on function rsvp_count(text) to anon;
alter table events add column if not exists capacity integer;
