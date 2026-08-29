-- Store detailed CAMIDE labels as metadata only. Captured images remain in memory
-- during inference and are never written to Supabase Storage.
begin;

alter table public.waste_identifications
add column if not exists object_key varchar(100),
add column if not exists object_label varchar(150);

create index if not exists idx_waste_identifications_recent
    on public.waste_identifications(created_at desc);

commit;
