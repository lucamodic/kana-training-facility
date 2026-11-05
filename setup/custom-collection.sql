begin;

alter table public.ktf_progress_events
  drop constraint if exists ktf_progress_events_event_type_check;

alter table public.ktf_progress_events
  add constraint ktf_progress_events_event_type_check
  check (event_type in ('exam_attempt','settings','custom_upsert','custom_delete','custom_review'));

commit;
