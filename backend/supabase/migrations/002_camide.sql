begin;

create table if not exists public.waste_identifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id),
    category varchar(20) not null check (category in ('organic', 'inorganic', 'b3', 'residual')),
    confidence numeric(6,5) not null check (confidence >= 0 and confidence <= 1),
    is_confident boolean not null,
    image_path text,
    model_version varchar(100),
    created_at timestamptz not null default now()
);

create index if not exists idx_waste_identifications_user
    on public.waste_identifications(user_id);
create index if not exists idx_waste_identifications_created_at
    on public.waste_identifications(created_at desc);

alter table public.waste_identifications enable row level security;
revoke all on table public.waste_identifications from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'waste-identification-images',
    'waste-identification-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
