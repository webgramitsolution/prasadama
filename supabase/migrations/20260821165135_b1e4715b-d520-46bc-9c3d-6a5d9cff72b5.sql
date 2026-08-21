insert into public.user_roles (user_id, role)
select '021bf767-6ca2-4920-8273-c2531f8f3b6e', 'admin'
where not exists (
  select 1 from public.user_roles where user_id = '021bf767-6ca2-4920-8273-c2531f8f3b6e' and role = 'admin'
);