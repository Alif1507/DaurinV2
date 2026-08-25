begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name varchar(150) not null,
    email varchar(255) not null unique,
    role varchar(20) not null check (role in ('student', 'teacher', 'staff', 'admin')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.locations (
    id uuid primary key default gen_random_uuid(),
    name varchar(150) not null unique,
    description text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.cleanliness_reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references public.profiles(id),
    location_id uuid not null references public.locations(id),
    problem_type varchar(50) not null check (
        problem_type in ('full_bin', 'scattered_waste', 'mixed_waste', 'dirty_area', 'damaged_bin', 'other')
    ),
    description varchar(500),
    photo_path text,
    status varchar(30) not null default 'reported' check (
        status in ('reported', 'in_progress', 'resolved')
    ),
    handled_by uuid references public.profiles(id),
    resolution_note varchar(500),
    started_at timestamptz,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint report_workflow_consistency check (
        (status = 'reported' and started_at is null and resolved_at is null)
        or (status = 'in_progress' and handled_by is not null and started_at is not null and resolved_at is null)
        or (status = 'resolved' and handled_by is not null and started_at is not null and resolved_at is not null)
    )
);

create table if not exists public.waste_records (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references public.locations(id),
    recorded_by uuid not null references public.profiles(id),
    record_date date not null,
    organic_weight numeric(10,2) not null default 0 check (organic_weight >= 0),
    inorganic_weight numeric(10,2) not null default 0 check (inorganic_weight >= 0),
    residual_weight numeric(10,2) not null default 0 check (residual_weight >= 0),
    notes varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint waste_has_weight check (
        organic_weight > 0 or inorganic_weight > 0 or residual_weight > 0
    )
);

create table if not exists public.waste_guides (
    id uuid primary key default gen_random_uuid(),
    name varchar(150) not null,
    category varchar(30) not null check (category in ('organic', 'inorganic', 'residual')),
    description text,
    instruction text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_reports_status on public.cleanliness_reports(status);
create index if not exists idx_reports_reporter on public.cleanliness_reports(reporter_id);
create index if not exists idx_reports_location on public.cleanliness_reports(location_id);
create index if not exists idx_reports_created_at on public.cleanliness_reports(created_at desc);
create index if not exists idx_waste_record_date on public.waste_records(record_date desc);
create index if not exists idx_waste_location on public.waste_records(location_id);
create index if not exists idx_waste_guides_name on public.waste_guides(name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.cleanliness_reports;
create trigger reports_set_updated_at before update on public.cleanliness_reports
for each row execute function public.set_updated_at();

drop trigger if exists waste_records_set_updated_at on public.waste_records;
create trigger waste_records_set_updated_at before update on public.waste_records
for each row execute function public.set_updated_at();

drop trigger if exists waste_guides_set_updated_at on public.waste_guides;
create trigger waste_guides_set_updated_at before update on public.waste_guides
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.cleanliness_reports enable row level security;
alter table public.waste_records enable row level security;
alter table public.waste_guides enable row level security;

-- The React application talks only to FastAPI. Direct anon/authenticated table
-- access remains denied; the backend service-role client bypasses RLS after RBAC.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.locations from anon, authenticated;
revoke all on table public.cleanliness_reports from anon, authenticated;
revoke all on table public.waste_records from anon, authenticated;
revoke all on table public.waste_guides from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'report-images',
    'report-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
