SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.labora_assignment_report (
  actor       uuid,
  assignment  uuid,
  page_offset integer,
  page_limit  integer
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
with owned as (
  select a.published_version_id as version from public.assignments a
  join public.school_members m on m.school_id=a.school_id and m.user_id=actor
  where a.id=assignment and a.teacher_id=actor and m.status='active' and m.role in ('teacher','owner')
), roster as (
  select r.student_id, p.display_name, max(e.score) as best_score
  from owned o join public.assignment_recipients r on r.assignment_version_id=o.version
  join public.profiles p on p.id=r.student_id
  left join public.experiment_results e on e.assignment_version_id=o.version and e.student_id=r.student_id
  group by r.student_id,p.display_name
), paged as (
  select * from roster order by display_name,student_id
  offset greatest(page_offset,0) limit least(greatest(page_limit,1),100)
)
select jsonb_build_object(
  'total',(select count(*) from roster),
  'completed',(select count(*) from roster where best_score is not null),
  'attempts',(select count(*) from public.experiment_results e join owned o on e.assignment_version_id=o.version),
  'recipients',coalesce((select jsonb_agg(jsonb_build_object('id',student_id,'name',display_name,'completed',best_score is not null,'bestScore',best_score)) from paged),'[]'::jsonb)
);
$function$;

REVOKE ALL ON FUNCTION "public"."labora_assignment_report"(uuid, uuid, integer, integer) FROM PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."labora_assignment_report"(uuid, uuid, integer, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_assignment_report"(uuid, uuid, integer, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_assignment_report"(uuid, uuid, integer, integer) TO "service_role";

