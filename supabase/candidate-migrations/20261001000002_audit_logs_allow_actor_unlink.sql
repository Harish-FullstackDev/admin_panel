-- audit_logs is append-only, but actor_id is ON DELETE SET NULL. Deleting an
-- auth user (e.g. a candidate exercising the right to deletion) performs that
-- UPDATE, which the immutability trigger rejected. Allow exactly that change:
-- actor_id -> NULL with every other column untouched. actor_email is kept, so
-- the log still shows who acted.
create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and old.actor_id is not null
     and new.actor_id is null
     and new.id = old.id
     and new.actor_email is not distinct from old.actor_email
     and new.action = old.action
     and new.entity_type = old.entity_type
     and new.entity_id is not distinct from old.entity_id
     and new.before is not distinct from old.before
     and new.after is not distinct from old.after
     and new.ip is not distinct from old.ip
     and new.created_at = old.created_at then
    return new;
  end if;
  raise exception 'audit_logs is append-only';
end;
$$;
