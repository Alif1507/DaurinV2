-- Preserve a separate staff completion photo without replacing the reporter's image.
begin;

alter table public.cleanliness_reports
add column if not exists resolution_photo_path text;

comment on column public.cleanliness_reports.resolution_photo_path is
'Private storage path for the staff photo proving that a report was handled.';

commit;
