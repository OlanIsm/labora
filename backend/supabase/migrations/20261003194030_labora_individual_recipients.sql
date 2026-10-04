SET local check_function_bodies = off;

DROP FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[]);

CREATE OR REPLACE FUNCTION public.labora_publish (
  actor             uuid,
  assignment        uuid,
  expected_revision integer,
  public_config     jsonb,
  keys              jsonb,
  classes           uuid[],
  students          uuid[]  DEFAULT NULL::uuid[]
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare a public.assignments; v public.assignment_versions; ev uuid; key record; begin
  select * into a from public.assignments where id=assignment and teacher_id=actor for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if not exists(select 1 from public.school_members where school_id=a.school_id and user_id=actor and role='teacher' and status='active') then raise exception 'FORBIDDEN'; end if;
  if a.status='published' then
    if (select config->'classIds' from public.assignment_versions where id=a.published_version_id) <> public_config->'classIds'
      or coalesce(students,'{}'::uuid[]) <> coalesce((select array_agg(student_id order by student_id) from public.assignment_targets where assignment_id=a.id and student_id is not null),'{}'::uuid[])
      then raise exception 'REVISION_CONFLICT'; end if;
    return to_jsonb(a);
  end if;
  if a.status <> 'draft' or a.revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  if classes is null or cardinality(classes) < 1 or cardinality(classes) > 20 or exists(select 1 from unnest(classes) c where not exists(select 1 from public.classes x where x.id=c and x.school_id=a.school_id and x.teacher_id=actor and x.archived_at is null)) then raise exception 'FORBIDDEN'; end if;
  if students is not null then
    if cardinality(students) < 1 or cardinality(students) > 1000 then raise exception 'VALIDATION_ERROR'; end if;
    if exists(select 1 from unnest(students) s where s is null or not exists(
      select 1 from public.class_members m join public.school_members sm
      on sm.user_id=m.student_id and sm.school_id=a.school_id and sm.status='active' and sm.role='student'
      where m.student_id=s and m.class_id=any(classes) and m.left_at is null
    )) then raise exception 'FORBIDDEN'; end if;
  end if;
  select current_version_id into ev from public.experiments where id=a.experiment_id and published;
  if ev is null then raise exception 'NOT_FOUND'; end if;
  insert into public.assignment_versions(assignment_id,version,experiment_version_id,config) values(a.id,1,ev,public_config) returning * into v;
  for key in select * from jsonb_each(keys) loop
    insert into private.answer_keys(assignment_version_id,question_key,correct_answer,explanation) values(v.id,key.key,key.value->'answer',key.value->>'explanation');
  end loop;
  if students is null then
    insert into public.assignment_targets(assignment_id,class_id) select a.id,c from unnest(classes) c;
  else
    insert into public.assignment_targets(assignment_id,student_id) select a.id,s from unnest(students) s;
  end if;
  insert into public.assignment_recipients(assignment_version_id,student_id,source_class_id)
    select distinct on (m.student_id) v.id,m.student_id,m.class_id from public.class_members m join public.school_members sm on sm.user_id=m.student_id and sm.school_id=a.school_id and sm.status='active' and sm.role='student' where m.class_id=any(classes) and m.left_at is null and (students is null or m.student_id=any(students)) order by m.student_id,m.class_id;
  insert into public.notifications(recipient_id,type,assignment_version_id,dedupe_key) select student_id,'assignment',v.id,'assignment:'||v.id from public.assignment_recipients where assignment_version_id=v.id;
  update public.assignments set published_version_id=v.id,status='published',revision=revision+1,updated_at=now() where id=a.id returning * into a;
  return to_jsonb(a);
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[], uuid[]) FROM PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[], uuid[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[], uuid[]) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[], uuid[]) TO "service_role";
