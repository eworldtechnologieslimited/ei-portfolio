-- seed-admin.sql: create (or reset) your super admin. EDIT the two values, then run once in the Supabase SQL editor.
-- Runs as the database owner, so it does not need the (now locked) admin RPCs.
create extension if not exists pgcrypto;
do $$
declare uname text := 'CHANGE_ME_USERNAME'; pw text := 'CHANGE_ME_STRONG_PASSWORD'; uid bigint;
begin
  if pw like 'CHANGE_ME%' or uname like 'CHANGE_ME%' then raise exception 'Edit username and password first'; end if;
  select id into uid from admin_users where role='super_admin' order by id limit 1;
  if uid is null then
    insert into admin_users(username,password_hash,display_name,email,role,permissions,status)
    values(uname,crypt(pw,gen_salt('bf')),'Super Admin','','super_admin','[]'::jsonb,'active');
  else
    update admin_users set username=uname,status='active',password_hash=crypt(pw,gen_salt('bf')) where id=uid;
  end if;
end $$;
-- SECURITY: the old built-in password was published in this repo; treat it as compromised everywhere you reused it.
