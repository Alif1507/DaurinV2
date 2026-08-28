begin;

create index if not exists idx_reports_status_created
    on public.cleanliness_reports(status, created_at desc);
create index if not exists idx_reports_location_created
    on public.cleanliness_reports(location_id, created_at desc);
create index if not exists idx_waste_location_date
    on public.waste_records(location_id, record_date desc);
create index if not exists idx_camide_category_created
    on public.waste_identifications(category, created_at desc);

commit;
