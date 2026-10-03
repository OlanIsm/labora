SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.labora_progress_summary (
  actor uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
select jsonb_build_object(
  'attempts',count(*),
  'completed',count(distinct v.experiment_id),
  'subjects',count(distinct e.subject),
  'averageScore',coalesce(round(avg(r.score)),0)
)
from public.experiment_results r
join public.experiment_versions v on v.id=r.experiment_version_id
join public.experiments e on e.id=v.experiment_id
where r.student_id=actor;
$function$;

REVOKE ALL ON FUNCTION "public"."labora_progress_summary"(uuid) FROM PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."labora_progress_summary"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_progress_summary"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_progress_summary"(uuid) TO "service_role";

