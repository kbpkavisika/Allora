alter table public.profiles disable row level security;
alter table public.addresses disable row level security;

insert into public.profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name'
from auth.users
where id not in (select id from public.profiles);
