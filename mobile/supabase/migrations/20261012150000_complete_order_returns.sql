-- Completes the return workflow. A buyer requests a return on a delivered order, the seller
-- approves or rejects it (a rejection always carries a note for the buyer), and once an approved
-- item is back the seller marks the return completed. Only one return per order can be open.

alter table public.order_returns drop constraint if exists order_returns_status_check;

alter table public.order_returns
  add column seller_note text check (char_length(seller_note) <= 500),
  add column updated_at timestamptz not null default now();

update public.order_returns set status = 'completed' where status = 'resolved';

-- The earlier screen allowed repeat submissions, so only the newest open request per order stays
-- open; older duplicates are closed before the one-open-return index is created.
update public.order_returns r
set status = 'rejected', seller_note = 'Replaced by a newer return request for this order.'
where r.status = 'open'
  and exists (
    select 1 from public.order_returns newer
    where newer.order_id = r.order_id
      and newer.status = 'open'
      and (newer.created_at, newer.id) > (r.created_at, r.id)
  );

update public.order_returns set status = 'requested' where status = 'open';

alter table public.order_returns
  alter column status set default 'requested',
  add constraint order_returns_status_check
    check (status in ('requested', 'approved', 'rejected', 'completed'));

create trigger order_returns_touch_updated_at
  before update on public.order_returns
  for each row execute function public.touch_updated_at();

create unique index order_returns_one_open_per_order
  on public.order_returns (order_id)
  where status in ('requested', 'approved');

create function public.request_return(p_order_id uuid, p_reason text, p_details text default null)
returns public.order_returns
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_details text := nullif(btrim(coalesce(p_details, '')), '');
  v_order public.orders;
  v_return public.order_returns;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null or v_order.buyer_id <> v_user then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if v_order.status <> 'completed' then
    raise exception 'Returns open once the order is delivered.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.order_returns
    where order_id = p_order_id and status in ('requested', 'approved')
  ) then
    raise exception 'A return is already open for this order.' using errcode = '22023';
  end if;

  if char_length(v_details) > 1000 then
    raise exception 'Keep the details under 1000 characters.' using errcode = '22023';
  end if;

  insert into public.order_returns (order_id, buyer_id, reason, details)
  values (p_order_id, v_user, p_reason, v_details)
  returning * into v_return;

  return v_return;
end;
$$;

create function public.respond_to_return(p_return_id uuid, p_decision text, p_note text default null)
returns public.order_returns
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_return public.order_returns;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  select r.* into v_return
  from public.order_returns r
  join public.orders o on o.id = r.order_id
  join public.shops s on s.id = o.shop_id
  where r.id = p_return_id and s.owner_id = v_user
  for update of r;

  if v_return.id is null then
    raise exception 'Return not found.' using errcode = 'P0002';
  end if;

  if p_decision = 'complete' then
    if v_return.status <> 'approved' then
      raise exception 'Only approved returns can be completed.' using errcode = '22023';
    end if;
  elsif p_decision in ('approved', 'rejected') then
    if v_return.status <> 'requested' then
      raise exception 'This return has already been answered.' using errcode = '22023';
    end if;

    if p_decision = 'rejected' and v_note is null then
      raise exception 'Tell the buyer why the return was rejected.' using errcode = '22023';
    end if;
  else
    raise exception 'Unknown decision.' using errcode = '22023';
  end if;

  if char_length(v_note) > 500 then
    raise exception 'Keep the note under 500 characters.' using errcode = '22023';
  end if;

  update public.order_returns
  set status = case when p_decision = 'complete' then 'completed' else p_decision end,
      seller_note = coalesce(v_note, seller_note)
  where id = p_return_id
  returning * into v_return;

  return v_return;
end;
$$;

revoke all on function public.request_return(uuid, text, text) from public, anon;
revoke all on function public.respond_to_return(uuid, text, text) from public, anon;

grant execute on function public.request_return(uuid, text, text) to authenticated;
grant execute on function public.respond_to_return(uuid, text, text) to authenticated;
