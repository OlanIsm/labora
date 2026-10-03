do $$ begin if to_regclass('public.assignments') is not null or to_regclass('public.experiment_results') is not null then raise exception 'Existing assessment tables require reviewed legacy migration'; end if; end $$;
SET local check_function_bodies = off;

CREATE SCHEMA "private";

CREATE TABLE "private"."answer_keys" (
  "id"                    uuid  NOT NULL DEFAULT gen_random_uuid(),
  "experiment_version_id" uuid,
  "assignment_version_id" uuid,
  "question_key"          text  NOT NULL,
  "correct_answer"        jsonb NOT NULL,
  "explanation"           text  NOT NULL,
  "rubric"                jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "answer_keys_assignment_version_id_question_key_key" UNIQUE (assignment_version_id, question_key),
  CONSTRAINT "answer_keys_check" CHECK ((num_nonnulls(experiment_version_id, assignment_version_id) = 1)),
  CONSTRAINT "answer_keys_experiment_version_id_question_key_key" UNIQUE (experiment_version_id, question_key),
  CONSTRAINT "answer_keys_pkey" PRIMARY KEY (id)
);

ALTER TABLE "private"."answer_keys"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "private"."rate_limits" (
  "scope"        text                     NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "hits"         integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "rate_limits_pkey" PRIMARY KEY (scope, window_start)
);

ALTER TABLE "private"."rate_limits"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."assignment_recipients" (
  "assignment_version_id" uuid                     NOT NULL,
  "student_id"            uuid                     NOT NULL,
  "source_class_id"       uuid,
  "assigned_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "assignment_recipients_pkey" PRIMARY KEY (assignment_version_id, student_id)
);

ALTER TABLE "public"."assignment_recipients"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."assignment_recipients" FROM "anon";

CREATE TABLE "public"."assignment_targets" (
  "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
  "assignment_id" uuid NOT NULL,
  "class_id"      uuid,
  "student_id"    uuid,
  CONSTRAINT "assignment_targets_assignment_id_class_id_key" UNIQUE (assignment_id, class_id),
  CONSTRAINT "assignment_targets_assignment_id_student_id_key" UNIQUE (assignment_id, student_id),
  CONSTRAINT "assignment_targets_check" CHECK ((num_nonnulls(class_id, student_id) = 1)),
  CONSTRAINT "assignment_targets_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."assignment_targets"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."assignment_targets" FROM "anon";

CREATE TABLE "public"."assignment_versions" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "assignment_id"         uuid                     NOT NULL,
  "version"               integer                  NOT NULL,
  "experiment_version_id" uuid                     NOT NULL,
  "config"                jsonb                    NOT NULL,
  "published_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "assignment_versions_assignment_id_version_key" UNIQUE (assignment_id, VERSION),
  CONSTRAINT "assignment_versions_id_assignment_id_key" UNIQUE (id, assignment_id),
  CONSTRAINT "assignment_versions_id_experiment_version_id_key" UNIQUE (id, experiment_version_id),
  CONSTRAINT "assignment_versions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."assignment_versions"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."assignment_versions" FROM "anon";

CREATE TABLE "public"."assignments" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "school_id"            uuid                     NOT NULL,
  "teacher_id"           uuid                     NOT NULL,
  "experiment_id"        text                     NOT NULL,
  "title"                text                     NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'draft'::text,
  "due_at"               timestamp with time zone,
  "draft_config"         jsonb                    NOT NULL,
  "published_version_id" uuid,
  "revision"             integer                  NOT NULL DEFAULT 0,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "assignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "assignments_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
  CONSTRAINT "assignments_title_check" CHECK (((length(title) >= 1) AND (length(title) <= 160)))
);

ALTER TABLE "public"."assignments"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."assignments" FROM "anon";

CREATE TABLE "public"."class_members" (
  "class_id"   uuid                     NOT NULL,
  "student_id" uuid                     NOT NULL,
  "joined_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "left_at"    timestamp with time zone,
  CONSTRAINT "class_members_pkey" PRIMARY KEY (class_id, student_id)
);

ALTER TABLE "public"."class_members"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."class_members" FROM "anon";

CREATE TABLE "public"."classes" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "school_id"   uuid                     NOT NULL,
  "teacher_id"  uuid                     NOT NULL,
  "name"        text                     NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "classes_id_school_id_key" UNIQUE (id, school_id),
  CONSTRAINT "classes_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 80))),
  CONSTRAINT "classes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."classes"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."classes" FROM "anon";

CREATE TABLE "public"."experiment_results" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"            uuid                     NOT NULL,
  "student_id"            uuid                     NOT NULL,
  "experiment_version_id" uuid                     NOT NULL,
  "assignment_version_id" uuid,
  "experiment_accuracy"   integer                  NOT NULL,
  "quiz_accuracy"         integer                  NOT NULL,
  "score"                 integer                  NOT NULL,
  "steps_completed"       integer                  NOT NULL,
  "steps_total"           integer                  NOT NULL,
  "scoring_version"       integer                  NOT NULL DEFAULT 1,
  "observations"          jsonb                    NOT NULL,
  "completed_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "experiment_results_check" CHECK (((steps_completed = steps_total) AND (steps_total > 0))),
  CONSTRAINT "experiment_results_experiment_accuracy_check" CHECK (((experiment_accuracy >= 0) AND (experiment_accuracy <= 100))),
  CONSTRAINT "experiment_results_pkey" PRIMARY KEY (id),
  CONSTRAINT "experiment_results_quiz_accuracy_check" CHECK (((quiz_accuracy >= 0) AND (quiz_accuracy <= 100))),
  CONSTRAINT "experiment_results_score_check" CHECK (((score >= 0) AND (score <= 100))),
  CONSTRAINT "experiment_results_scoring_version_check" CHECK ((scoring_version = 1)),
  CONSTRAINT "experiment_results_session_id_key" UNIQUE (session_id)
);

ALTER TABLE "public"."experiment_results"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."experiment_results" FROM "anon";

CREATE TABLE "public"."experiment_versions" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "experiment_id"  text                     NOT NULL,
  "version"        integer                  NOT NULL,
  "definition"     jsonb                    NOT NULL,
  "engine_version" integer                  NOT NULL DEFAULT 1,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "experiment_versions_definition_check" CHECK ((jsonb_typeof(definition) = 'object'::text)),
  CONSTRAINT "experiment_versions_engine_version_check" CHECK ((engine_version = 1)),
  CONSTRAINT "experiment_versions_experiment_id_version_key" UNIQUE (experiment_id, VERSION),
  CONSTRAINT "experiment_versions_id_experiment_id_key" UNIQUE (id, experiment_id),
  CONSTRAINT "experiment_versions_pkey" PRIMARY KEY (id),
  CONSTRAINT "experiment_versions_version_check" CHECK ((version > 0))
);

ALTER TABLE "public"."experiment_versions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."experiments" (
  "id"                 text                     NOT NULL,
  "subject"            text                     NOT NULL,
  "title"              text                     NOT NULL,
  "summary"            text                     NOT NULL,
  "duration_minutes"   integer                  NOT NULL,
  "current_version_id" uuid,
  "published"          boolean                  NOT NULL DEFAULT true,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "experiments_duration_minutes_check" CHECK ((duration_minutes > 0)),
  CONSTRAINT "experiments_pkey" PRIMARY KEY (id),
  CONSTRAINT "experiments_subject_check" CHECK ((subject = ANY (ARRAY['chemistry'::text, 'physics'::text, 'biology'::text])))
);

ALTER TABLE "public"."experiments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."invitations" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "school_id"     uuid                     NOT NULL,
  "class_id"      uuid,
  "invited_email" text,
  "role"          text                     NOT NULL,
  "token_hash"    text                     NOT NULL,
  "created_by"    uuid                     NOT NULL,
  "expires_at"    timestamp with time zone NOT NULL,
  "max_uses"      integer                  NOT NULL,
  "uses"          integer                  NOT NULL DEFAULT 0,
  "revoked_at"    timestamp with time zone,
  CONSTRAINT "invitations_check1" CHECK (((class_id IS NULL) OR (role = 'student'::text))),
  CONSTRAINT "invitations_check" CHECK (((uses >= 0) AND (uses <= max_uses))),
  CONSTRAINT "invitations_max_uses_check" CHECK (((max_uses >= 1) AND (max_uses <= 1000))),
  CONSTRAINT "invitations_pkey" PRIMARY KEY (id),
  CONSTRAINT "invitations_role_check" CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text]))),
  CONSTRAINT "invitations_token_hash_key" UNIQUE (token_hash)
);

ALTER TABLE "public"."invitations"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."invitations" FROM "anon";

CREATE TABLE "public"."lab_actions" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"      uuid                     NOT NULL,
  "client_event_id" uuid                     NOT NULL,
  "sequence"        integer                  NOT NULL,
  "action_type"     text                     NOT NULL,
  "payload"         jsonb                    NOT NULL,
  "accepted"        boolean                  NOT NULL,
  "feedback"        text                     NOT NULL,
  "outcome"         jsonb                    NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "lab_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "lab_actions_session_id_client_event_id_key" UNIQUE (session_id, client_event_id),
  CONSTRAINT "lab_actions_session_id_sequence_key" UNIQUE (session_id, SEQUENCE)
);

ALTER TABLE "public"."lab_actions"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."lab_actions" FROM "anon";

CREATE TABLE "public"."lab_notes" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"           uuid                     NOT NULL,
  "author_id"            uuid                     NOT NULL,
  "hypothesis"           text                     NOT NULL DEFAULT ''::text,
  "observation"          text                     NOT NULL DEFAULT ''::text,
  "conclusion"           text                     NOT NULL DEFAULT ''::text,
  "measurement_snapshot" jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "lab_notes_conclusion_check" CHECK ((length(conclusion) <= 4000)),
  CONSTRAINT "lab_notes_hypothesis_check" CHECK ((length(hypothesis) <= 4000)),
  CONSTRAINT "lab_notes_observation_check" CHECK ((length(observation) <= 4000)),
  CONSTRAINT "lab_notes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."lab_notes"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."lab_notes" FROM "anon";

CREATE TABLE "public"."lab_sessions" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "student_id"            uuid                     NOT NULL,
  "mode"                  text                     NOT NULL,
  "subject"               text                     NOT NULL,
  "simulation_key"        text,
  "experiment_version_id" uuid,
  "assignment_version_id" uuid,
  "status"                text                     NOT NULL DEFAULT 'active'::text,
  "current_step"          integer                  NOT NULL DEFAULT 0,
  "state"                 jsonb                    NOT NULL,
  "state_version"         integer                  NOT NULL DEFAULT 1,
  "revision"              integer                  NOT NULL DEFAULT 0,
  "start_event_id"        uuid                     NOT NULL,
  "started_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "last_saved_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "submitted_at"          timestamp with time zone,
  CONSTRAINT "lab_sessions_check" CHECK ((((mode = 'guided'::text) AND (experiment_version_id IS
    NOT NULL)) OR ((mode = 'sandbox'::text) AND (experiment_version_id IS NULL) AND (assignment_version_id IS NULL)))),
  CONSTRAINT "lab_sessions_current_step_check" CHECK ((current_step >= 0)),
  CONSTRAINT "lab_sessions_mode_check" CHECK ((mode = ANY (ARRAY['guided'::text, 'sandbox'::text]))),
  CONSTRAINT "lab_sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "lab_sessions_revision_check" CHECK ((revision >= 0)),
  CONSTRAINT "lab_sessions_state_version_check" CHECK ((state_version = 1)),
  CONSTRAINT "lab_sessions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'submitted'::text, 'abandoned'::text]))),
  CONSTRAINT "lab_sessions_student_id_start_event_id_key" UNIQUE (student_id, start_event_id),
  CONSTRAINT "lab_sessions_subject_check" CHECK ((subject = ANY (ARRAY['chemistry'::text, 'physics'::text, 'biology'::text, 'free'::text])))
);

ALTER TABLE "public"."lab_sessions"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."lab_sessions" FROM "anon";

CREATE TABLE "public"."notifications" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "recipient_id"          uuid                     NOT NULL,
  "type"                  text                     NOT NULL,
  "assignment_version_id" uuid,
  "result_id"             uuid,
  "dedupe_key"            text                     NOT NULL,
  "read_at"               timestamp with time zone,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_recipient_id_dedupe_key_key" UNIQUE (recipient_id, dedupe_key),
  CONSTRAINT "notifications_type_check" CHECK ((type = ANY (ARRAY['assignment'::text, 'result'::text])))
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."notifications" FROM "anon";

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text                     NOT NULL,
  "avatar_path"  text,
  "preferences"  jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "bounded_preferences" CHECK ((octet_length((preferences)::text) <= 8192)),
  CONSTRAINT "profiles_display_name_check" CHECK (((length(display_name) >= 1) AND (length(display_name) <= 100))),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_preferences_check" CHECK ((jsonb_typeof(preferences) = 'object'::text))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

CREATE TABLE "public"."quiz_responses" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"     uuid                     NOT NULL,
  "question_key"   text                     NOT NULL,
  "attempt_no"     integer                  NOT NULL,
  "answer"         jsonb                    NOT NULL,
  "is_correct"     boolean                  NOT NULL,
  "points_awarded" numeric                  NOT NULL,
  "answered_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "quiz_responses_attempt_no_check" CHECK ((attempt_no > 0)),
  CONSTRAINT "quiz_responses_pkey" PRIMARY KEY (id),
  CONSTRAINT "quiz_responses_points_awarded_check" CHECK (((points_awarded >= (0)::numeric) AND (points_awarded <= (1)::numeric))),
  CONSTRAINT "quiz_responses_session_id_question_key_attempt_no_key" UNIQUE (session_id, question_key, attempt_no)
);

ALTER TABLE "public"."quiz_responses"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."quiz_responses" FROM "anon";

CREATE TABLE "public"."school_members" (
  "school_id" uuid                     NOT NULL,
  "user_id"   uuid                     NOT NULL,
  "role"      text                     NOT NULL,
  "status"    text                     NOT NULL DEFAULT 'active'::text,
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "school_members_pkey" PRIMARY KEY (school_id, user_id),
  CONSTRAINT "school_members_role_check" CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text]))),
  CONSTRAINT "school_members_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."school_members"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."school_members" FROM "anon";

CREATE TABLE "public"."schools" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "owner_id"   uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "schools_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 120))),
  CONSTRAINT "schools_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."schools"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."schools" FROM "anon";

CREATE OR REPLACE FUNCTION private.bootstrap_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Pelajar'),100));
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.check_class_scope()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if tg_table_name='classes' then
    if not exists(select 1 from public.school_members where school_id=new.school_id and user_id=new.teacher_id and role='teacher' and status='active') then raise exception 'FORBIDDEN'; end if;
  else
    if not exists(select 1 from public.classes c join public.school_members m on m.school_id=c.school_id and m.user_id=new.student_id and m.role='student' and m.status='active' where c.id=new.class_id and c.archived_at is null) then raise exception 'FORBIDDEN'; end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.immutable_record()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$ begin raise exception 'Published records are immutable'; end $function$;

CREATE OR REPLACE FUNCTION public.labora_accept_invitation (
  actor         uuid,
  email_address text,
  digest        text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare i public.invitations; begin
  select * into i from public.invitations where token_hash=digest for update;
  if i.id is null or i.revoked_at is not null or i.expires_at <= now() or (i.invited_email is not null and lower(i.invited_email) <> lower(email_address)) then raise exception 'NOT_FOUND'; end if;
  if exists(select 1 from public.school_members where school_id=i.school_id and user_id=actor and status='active') and (i.class_id is null or exists(select 1 from public.class_members where class_id=i.class_id and student_id=actor and left_at is null)) then
    return jsonb_build_object('schoolId',i.school_id,'classId',i.class_id);
  end if;
  if i.uses >= i.max_uses then raise exception 'NOT_FOUND'; end if;
  if i.role='teacher' and not exists(select 1 from public.schools where id=i.school_id and owner_id=i.created_by) then raise exception 'FORBIDDEN'; end if;
  if i.class_id is not null and not exists(select 1 from public.classes where id=i.class_id and teacher_id=i.created_by and archived_at is null) then raise exception 'NOT_FOUND'; end if;
  insert into public.school_members(school_id,user_id,role) values(i.school_id,actor,i.role) on conflict(school_id,user_id) do update set status='active';
  if i.class_id is not null then
    if not exists(select 1 from public.school_members where school_id=i.school_id and user_id=actor and role='student') then raise exception 'FORBIDDEN'; end if;
    insert into public.class_members(class_id,student_id) values(i.class_id,actor) on conflict(class_id,student_id) do update set left_at=null;
  end if;
  update public.invitations set uses=uses+1 where id=i.id;
  update public.profiles set preferences=preferences || jsonb_build_object('active_school_id',i.school_id),updated_at=now() where id=actor;
  return jsonb_build_object('schoolId',i.school_id,'classId',i.class_id);
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_accept_invitation"(uuid, text, text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_answer_keys (
  version_id    uuid,
  assignment_id uuid DEFAULT NULL::uuid
)
  RETURNS jsonb
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
  select coalesce(jsonb_object_agg(question_key,jsonb_build_object('answer',correct_answer,'explanation',explanation)),'{}'::jsonb)
  from private.answer_keys where (assignment_id is null and experiment_version_id=version_id) or (assignment_id is not null and assignment_version_id=assignment_id);
$function$;

REVOKE ALL ON FUNCTION "public"."labora_answer_keys"(uuid, uuid) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_commit_event (
  actor             uuid,
  session           uuid,
  event             uuid,
  expected_revision integer,
  event_type        text,
  event_payload     jsonb,
  new_state         jsonb,
  is_accepted       boolean,
  response          jsonb,
  quiz              jsonb   DEFAULT NULL::jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare s public.lab_sessions; previous public.lab_actions; begin
  select * into s from public.lab_sessions where id=session and student_id=actor for update;
  if s.id is null then raise exception 'NOT_FOUND'; end if;
  select * into previous from public.lab_actions where session_id=session and client_event_id=event;
  if previous.id is not null then
    if previous.payload <> event_payload or previous.action_type <> event_type then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return previous.outcome;
  end if;
  if s.status <> 'active' then raise exception 'REVISION_CONFLICT'; end if;
  if s.revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  update public.lab_sessions set state=new_state,current_step=coalesce((new_state->>'step')::integer,0),revision=revision+1,last_saved_at=now() where id=session;
  insert into public.lab_actions(session_id,client_event_id,sequence,action_type,payload,accepted,feedback,outcome)
    values(session,event,s.revision+1,event_type,event_payload,is_accepted,coalesce(response->>'feedback',''),response);
  if quiz is not null then
    insert into public.quiz_responses(session_id,question_key,attempt_no,answer,is_correct,points_awarded)
      values(session,quiz->>'key',1,quiz->'choice',(quiz->>'correct')::boolean,case when (quiz->>'correct')::boolean then 1 else 0 end);
  end if;
  return response;
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_commit_event"(uuid, uuid, uuid, integer, text, jsonb, jsonb, boolean, jsonb, jsonb) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_create_school (
  actor       uuid,
  school_name text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare s public.schools; begin
  if (select count(*) from public.schools where owner_id=actor) >= 3 then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.schools(name,owner_id) values(school_name,actor) returning * into s;
  insert into public.school_members(school_id,user_id,role) values(s.id,actor,'teacher');
  update public.profiles set preferences=preferences || jsonb_build_object('active_school_id',s.id),updated_at=now() where id=actor;
  return to_jsonb(s);
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_create_school"(uuid, text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_publish (
  actor             uuid,
  assignment        uuid,
  expected_revision integer,
  public_config     jsonb,
  keys              jsonb,
  classes           uuid[]
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare a public.assignments; v public.assignment_versions; ev uuid; key record; begin
  select * into a from public.assignments where id=assignment and teacher_id=actor for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.status='published' then return to_jsonb(a); end if;
  if a.status <> 'draft' or a.revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  if cardinality(classes) < 1 or exists(select 1 from unnest(classes) c where not exists(select 1 from public.classes x where x.id=c and x.school_id=a.school_id and x.teacher_id=actor and x.archived_at is null)) then raise exception 'FORBIDDEN'; end if;
  select current_version_id into ev from public.experiments where id=a.experiment_id and published;
  if ev is null then raise exception 'NOT_FOUND'; end if;
  insert into public.assignment_versions(assignment_id,version,experiment_version_id,config) values(a.id,1,ev,public_config) returning * into v;
  for key in select * from jsonb_each(keys) loop
    insert into private.answer_keys(assignment_version_id,question_key,correct_answer,explanation) values(v.id,key.key,key.value->'answer',key.value->>'explanation');
  end loop;
  insert into public.assignment_targets(assignment_id,class_id) select a.id,c from unnest(classes) c;
  insert into public.assignment_recipients(assignment_version_id,student_id,source_class_id)
    select distinct on (m.student_id) v.id,m.student_id,m.class_id from public.class_members m join public.school_members sm on sm.user_id=m.student_id and sm.school_id=a.school_id and sm.status='active' where m.class_id=any(classes) and m.left_at is null order by m.student_id,m.class_id;
  insert into public.notifications(recipient_id,type,assignment_version_id,dedupe_key) select student_id,'assignment',v.id,'assignment:'||v.id from public.assignment_recipients where assignment_version_id=v.id;
  update public.assignments set published_version_id=v.id,status='published',revision=revision+1,updated_at=now() where id=a.id returning * into a;
  return to_jsonb(a);
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[]) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_rate_limit (
  scope_key text,
  quota     integer
)
  RETURNS boolean
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare count integer; begin
  if length(scope_key)>100 or quota<1 or quota>1000 then raise exception 'VALIDATION_ERROR'; end if;
  insert into private.rate_limits(scope,window_start) values(scope_key,date_trunc('minute',now())) on conflict(scope,window_start) do update set hits=private.rate_limits.hits+1 returning hits into count;
  delete from private.rate_limits where (scope,window_start) in (select scope,window_start from private.rate_limits where window_start<now()-interval '1 day' limit 100);
  return count<=quota;
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_rate_limit"(text, integer) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.labora_submit (
  actor             uuid,
  session           uuid,
  expected_revision integer,
  assessment        jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare s public.lab_sessions; r public.experiment_results; begin
  select * into s from public.lab_sessions where id=session and student_id=actor for update;
  if s.id is null then raise exception 'NOT_FOUND'; end if;
  select * into r from public.experiment_results where session_id=session;
  if r.id is not null then return to_jsonb(r); end if;
  if s.status <> 'active' or s.revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  if s.mode <> 'guided' then raise exception 'VALIDATION_ERROR'; end if;
  if s.assignment_version_id is not null and not exists(select 1 from public.assignment_recipients where assignment_version_id=s.assignment_version_id and student_id=actor) then raise exception 'FORBIDDEN'; end if;
  insert into public.experiment_results(session_id,student_id,experiment_version_id,assignment_version_id,experiment_accuracy,quiz_accuracy,score,steps_completed,steps_total,observations)
    values(session,actor,s.experiment_version_id,s.assignment_version_id,(assessment->>'accuracy')::integer,(assessment->>'quiz')::integer,(assessment->>'score')::integer,(assessment->>'steps')::integer,(assessment->>'steps')::integer,assessment->'observations') returning * into r;
  update public.lab_sessions set status='submitted',submitted_at=now(),revision=revision+1,last_saved_at=now() where id=session;
  insert into public.notifications(recipient_id,type,result_id,dedupe_key) values(actor,'result',r.id,'result:'||r.id);
  if s.assignment_version_id is not null then
    insert into public.notifications(recipient_id,type,result_id,dedupe_key)
      select a.teacher_id,'result',r.id,'result:'||r.id from public.assignment_versions v join public.assignments a on a.id=v.assignment_id where v.id=s.assignment_version_id;
  end if;
  return to_jsonb(r);
end $function$;

REVOKE ALL ON FUNCTION "public"."labora_submit"(uuid, uuid, integer, jsonb) FROM PUBLIC, "anon", "authenticated";

ALTER TABLE "private"."answer_keys"
  ADD CONSTRAINT "answer_keys_assignment_version_id_fkey" FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);

ALTER TABLE "public"."assignment_recipients"
  ADD CONSTRAINT "assignment_recipients_assignment_version_id_fkey" FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);

ALTER TABLE "public"."assignment_targets"
  ADD CONSTRAINT "assignment_targets_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);

ALTER TABLE "public"."assignment_versions"
  ADD CONSTRAINT "assignment_versions_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_published_version_id_id_fkey" FOREIGN KEY (published_version_id, id) REFERENCES public.assignment_versions(id, assignment_id);

ALTER TABLE "public"."assignment_recipients"
  ADD CONSTRAINT "assignment_recipients_source_class_id_fkey" FOREIGN KEY (source_class_id) REFERENCES public.classes(id);

ALTER TABLE "public"."assignment_targets"
  ADD CONSTRAINT "assignment_targets_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id);

ALTER TABLE "public"."class_members"
  ADD CONSTRAINT "class_members_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id);

ALTER TABLE "public"."experiment_results"
  ADD CONSTRAINT "experiment_results_assignment_version_id_fkey" FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);

ALTER TABLE "private"."answer_keys"
  ADD CONSTRAINT "answer_keys_experiment_version_id_fkey" FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);

ALTER TABLE "public"."assignment_versions"
  ADD CONSTRAINT "assignment_versions_experiment_version_id_fkey" FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);

ALTER TABLE "public"."experiment_results"
  ADD CONSTRAINT "experiment_results_experiment_version_id_fkey" FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);

ALTER TABLE "public"."experiments"
  ADD CONSTRAINT "experiments_current_version_id_id_fkey" FOREIGN KEY (current_version_id, id) REFERENCES public.experiment_versions(id, experiment_id);

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_experiment_id_fkey" FOREIGN KEY (experiment_id) REFERENCES public.experiments(id);

ALTER TABLE "public"."experiment_versions"
  ADD CONSTRAINT "experiment_versions_experiment_id_fkey" FOREIGN KEY (experiment_id) REFERENCES public.experiments(id);

ALTER TABLE "public"."invitations"
  ADD CONSTRAINT "invitations_class_id_school_id_fkey" FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id);

ALTER TABLE "public"."lab_sessions"
  ADD CONSTRAINT "lab_sessions_assignment_version_id_experiment_version_id_fkey" FOREIGN KEY (assignment_version_id, experiment_version_id)
    REFERENCES public.assignment_versions(id, experiment_version_id);

ALTER TABLE "public"."lab_sessions"
  ADD CONSTRAINT "lab_sessions_assignment_version_id_student_id_fkey" FOREIGN KEY (assignment_version_id, student_id)
    REFERENCES public.assignment_recipients(assignment_version_id, student_id);

ALTER TABLE "public"."lab_sessions"
  ADD CONSTRAINT "lab_sessions_experiment_version_id_fkey" FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);

ALTER TABLE "public"."experiment_results"
  ADD CONSTRAINT "experiment_results_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);

ALTER TABLE "public"."lab_actions"
  ADD CONSTRAINT "lab_actions_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);

ALTER TABLE "public"."lab_notes"
  ADD CONSTRAINT "lab_notes_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_assignment_version_id_fkey" FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_result_id_fkey" FOREIGN KEY (result_id) REFERENCES public.experiment_results(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id);

ALTER TABLE "public"."assignment_recipients"
  ADD CONSTRAINT "assignment_recipients_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."assignment_targets"
  ADD CONSTRAINT "assignment_targets_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."class_members"
  ADD CONSTRAINT "class_members_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."classes"
  ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."experiment_results"
  ADD CONSTRAINT "experiment_results_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."invitations"
  ADD CONSTRAINT "invitations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."lab_notes"
  ADD CONSTRAINT "lab_notes_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."lab_sessions"
  ADD CONSTRAINT "lab_sessions_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."quiz_responses"
  ADD CONSTRAINT "quiz_responses_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);

ALTER TABLE "public"."school_members"
  ADD CONSTRAINT "school_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."schools"
  ADD CONSTRAINT "schools_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id);

ALTER TABLE "public"."classes"
  ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id);

ALTER TABLE "public"."invitations"
  ADD CONSTRAINT "invitations_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id);

ALTER TABLE "public"."school_members"
  ADD CONSTRAINT "school_members_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id);

CREATE INDEX assignment_versions_experiment ON public.assignment_versions USING btree (experiment_version_id);

CREATE INDEX assignments_experiment ON public.assignments USING btree (experiment_id);

CREATE INDEX assignments_school ON public.assignments USING btree (school_id);

CREATE INDEX assignments_teacher ON public.assignments USING btree (teacher_id, status, created_at DESC);

CREATE INDEX assignments_version ON public.assignments USING btree (published_version_id);

CREATE INDEX class_members_student ON public.class_members USING btree (student_id)
  WHERE (left_at IS NULL);

CREATE INDEX classes_school ON public.classes USING btree (school_id);

CREATE INDEX classes_teacher ON public.classes USING btree (teacher_id, school_id);

CREATE INDEX experiments_version ON public.experiments USING btree (current_version_id);

CREATE INDEX invitations_class ON public.invitations USING btree (class_id, school_id);

CREATE INDEX invitations_creator ON public.invitations USING btree (created_by);

CREATE INDEX invitations_school ON public.invitations USING btree (school_id);

CREATE INDEX members_user ON public.school_members USING btree (user_id, status, joined_at);

CREATE INDEX notes_author ON public.lab_notes USING btree (author_id, updated_at DESC);

CREATE INDEX notes_session ON public.lab_notes USING btree (session_id);

CREATE INDEX notifications_assignment ON public.notifications USING btree (assignment_version_id);

CREATE INDEX notifications_result ON public.notifications USING btree (result_id);

CREATE INDEX notifications_unread ON public.notifications USING btree (recipient_id, created_at DESC)
  WHERE (read_at IS NULL);

CREATE INDEX recipients_class ON public.assignment_recipients USING btree (source_class_id);

CREATE INDEX recipients_student ON public.assignment_recipients USING btree (student_id, assigned_at DESC);

CREATE INDEX results_assignment ON public.experiment_results USING btree (assignment_version_id, score DESC);

CREATE INDEX results_experiment ON public.experiment_results USING btree (experiment_version_id);

CREATE INDEX results_student ON public.experiment_results USING btree (student_id, completed_at DESC);

CREATE INDEX schools_owner ON public.schools USING btree (owner_id);

CREATE INDEX sessions_assignment ON public.lab_sessions USING btree (assignment_version_id);

CREATE INDEX sessions_experiment ON public.lab_sessions USING btree (experiment_version_id);

CREATE INDEX sessions_student ON public.lab_sessions USING btree (student_id, last_saved_at DESC);

CREATE INDEX targets_class ON public.assignment_targets USING btree (class_id);

CREATE INDEX targets_student ON public.assignment_targets USING btree (student_id);

CREATE TRIGGER create_labora_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.bootstrap_profile();

CREATE TRIGGER immutable_assignment_version
  BEFORE DELETE OR UPDATE ON public.assignment_versions
  FOR EACH ROW
  EXECUTE FUNCTION private.immutable_record();

CREATE TRIGGER validate_class_student
  BEFORE INSERT OR UPDATE ON public.class_members
  FOR EACH ROW
  EXECUTE FUNCTION private.check_class_scope();

CREATE TRIGGER validate_class_teacher
  BEFORE INSERT OR UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION private.check_class_scope();

CREATE TRIGGER immutable_result
  BEFORE DELETE OR UPDATE ON public.experiment_results
  FOR EACH ROW
  EXECUTE FUNCTION private.immutable_record();

CREATE TRIGGER immutable_experiment_version
  BEFORE DELETE OR UPDATE ON public.experiment_versions
  FOR EACH ROW
  EXECUTE FUNCTION private.immutable_record();

CREATE TRIGGER immutable_action
  BEFORE DELETE OR UPDATE ON public.lab_actions
  FOR EACH ROW
  EXECUTE FUNCTION private.immutable_record();

CREATE TRIGGER immutable_response
  BEFORE DELETE OR UPDATE ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION private.immutable_record();

CREATE POLICY "recipient_read" ON "public"."assignment_recipients"
  FOR SELECT
  TO "authenticated"
  USING ((student_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "target_read" ON "public"."assignment_targets"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_targets.assignment_id) AND (a.teacher_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "assignment_version_read" ON "public"."assignment_versions"
  FOR SELECT
  TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_versions.assignment_id) AND (a.teacher_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.assignment_recipients r
  WHERE ((r.assignment_version_id = assignment_versions.id) AND (r.student_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "assignment_read" ON "public"."assignments"
  FOR SELECT
  TO "authenticated"
  USING (((teacher_id = ( SELECT auth.uid() AS uid)) OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM public.assignment_recipients r
  WHERE ((r.assignment_version_id = assignments.published_version_id) AND (r.student_id = ( SELECT auth.uid() AS uid))))))));

CREATE POLICY "class_member_read" ON "public"."class_members"
  FOR SELECT
  TO "authenticated"
  USING ((student_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "class_read" ON "public"."classes"
  FOR SELECT
  TO "authenticated"
  USING (((teacher_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.class_members m
  WHERE ((m.class_id = classes.id) AND (m.student_id = ( SELECT auth.uid() AS uid)) AND (m.left_at IS NULL))))));

CREATE POLICY "result_read" ON "public"."experiment_results"
  FOR SELECT
  TO "authenticated"
  USING ((student_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "catalog_version_read" ON "public"."experiment_versions"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.experiments e
  WHERE ((e.id = experiment_versions.experiment_id) AND e.published))));

CREATE POLICY "catalog_read" ON "public"."experiments"
  FOR SELECT
  TO "anon", "authenticated"
  USING (published);

CREATE POLICY "invitation_read" ON "public"."invitations"
  FOR SELECT
  TO "authenticated"
  USING ((created_by = ( SELECT auth.uid() AS uid)));

CREATE POLICY "action_read" ON "public"."lab_actions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.lab_sessions s
  WHERE ((s.id = lab_actions.session_id) AND (s.student_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "note_read" ON "public"."lab_notes"
  FOR SELECT
  TO "authenticated"
  USING ((author_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "session_read" ON "public"."lab_sessions"
  FOR SELECT
  TO "authenticated"
  USING ((student_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "notification_read" ON "public"."notifications"
  FOR SELECT
  TO "authenticated"
  USING ((recipient_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "notification_update" ON "public"."notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((recipient_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((recipient_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profile_read" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profile_update" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "response_read" ON "public"."quiz_responses"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.lab_sessions s
  WHERE ((s.id = quiz_responses.session_id) AND (s.student_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "membership_read" ON "public"."school_members"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "school_read" ON "public"."schools"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.school_members m
  WHERE ((m.school_id = schools.id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.status = 'active'::text)))));

REVOKE ALL ON FUNCTION "private"."bootstrap_profile"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "private"."check_class_scope"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "private"."immutable_record"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."labora_accept_invitation"(uuid, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_accept_invitation"(uuid, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_accept_invitation"(uuid, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_answer_keys"(uuid, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_answer_keys"(uuid, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_answer_keys"(uuid, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_commit_event"(uuid, uuid, uuid, integer, text, jsonb, jsonb, boolean, jsonb, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_commit_event"(uuid, uuid, uuid, integer, text, jsonb, jsonb, boolean, jsonb, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_commit_event"(uuid, uuid, uuid, integer, text, jsonb, jsonb, boolean, jsonb, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_create_school"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_create_school"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_create_school"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[]) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_publish"(uuid, uuid, integer, jsonb, jsonb, uuid[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_rate_limit"(text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_rate_limit"(text, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_rate_limit"(text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."labora_submit"(uuid, uuid, integer, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_submit"(uuid, uuid, integer, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."labora_submit"(uuid, uuid, integer, jsonb) TO "service_role";

GRANT USAGE ON SCHEMA "private" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."answer_keys" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."rate_limits" TO "service_role";

REVOKE ALL ON TABLE "public"."assignment_recipients" FROM "authenticated";

GRANT SELECT ON TABLE "public"."assignment_recipients" TO "authenticated";

REVOKE ALL ON TABLE "public"."assignment_recipients" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_recipients" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_recipients" TO "service_role";

REVOKE ALL ON TABLE "public"."assignment_targets" FROM "authenticated";

GRANT SELECT ON TABLE "public"."assignment_targets" TO "authenticated";

REVOKE ALL ON TABLE "public"."assignment_targets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_targets" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_targets" TO "service_role";

REVOKE ALL ON TABLE "public"."assignment_versions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."assignment_versions" TO "authenticated";

REVOKE ALL ON TABLE "public"."assignment_versions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_versions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignment_versions" TO "service_role";

REVOKE ALL ON TABLE "public"."assignments" FROM "authenticated";

REVOKE ALL ("created_at") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("created_at") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("due_at") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("due_at") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("experiment_id") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("experiment_id") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("id") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("id") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("published_version_id") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("published_version_id") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("revision") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("revision") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("school_id") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("school_id") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("status") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("teacher_id") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("teacher_id") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("title") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."assignments" FROM "authenticated";

GRANT SELECT ("updated_at") ON TABLE "public"."assignments" TO "authenticated";

REVOKE ALL ON TABLE "public"."assignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignments" TO "service_role";

REVOKE ALL ON TABLE "public"."class_members" FROM "authenticated";

GRANT SELECT ON TABLE "public"."class_members" TO "authenticated";

REVOKE ALL ON TABLE "public"."class_members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."class_members" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."class_members" TO "service_role";

REVOKE ALL ON TABLE "public"."classes" FROM "authenticated";

GRANT SELECT ON TABLE "public"."classes" TO "authenticated";

REVOKE ALL ON TABLE "public"."classes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "service_role";

REVOKE ALL ON TABLE "public"."experiment_results" FROM "authenticated";

GRANT SELECT ON TABLE "public"."experiment_results" TO "authenticated";

REVOKE ALL ON TABLE "public"."experiment_results" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiment_results" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiment_results" TO "service_role";

REVOKE ALL ON TABLE "public"."experiment_versions" FROM "anon";

GRANT SELECT ON TABLE "public"."experiment_versions" TO "anon";

REVOKE ALL ON TABLE "public"."experiment_versions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."experiment_versions" TO "authenticated";

REVOKE ALL ON TABLE "public"."experiment_versions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiment_versions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiment_versions" TO "service_role";

REVOKE ALL ON TABLE "public"."experiments" FROM "anon";

GRANT SELECT ON TABLE "public"."experiments" TO "anon";

REVOKE ALL ON TABLE "public"."experiments" FROM "authenticated";

GRANT SELECT ON TABLE "public"."experiments" TO "authenticated";

REVOKE ALL ON TABLE "public"."experiments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."experiments" TO "service_role";

REVOKE ALL ON TABLE "public"."invitations" FROM "authenticated";

GRANT SELECT ON TABLE "public"."invitations" TO "authenticated";

REVOKE ALL ON TABLE "public"."invitations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."invitations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."invitations" TO "service_role";

REVOKE ALL ON TABLE "public"."lab_actions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."lab_actions" TO "authenticated";

REVOKE ALL ON TABLE "public"."lab_actions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_actions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_actions" TO "service_role";

REVOKE ALL ON TABLE "public"."lab_notes" FROM "authenticated";

GRANT SELECT ON TABLE "public"."lab_notes" TO "authenticated";

REVOKE ALL ON TABLE "public"."lab_notes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_notes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_notes" TO "service_role";

REVOKE ALL ON TABLE "public"."lab_sessions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."lab_sessions" TO "authenticated";

REVOKE ALL ON TABLE "public"."lab_sessions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_sessions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lab_sessions" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM "authenticated";

REVOKE ALL ("read_at") ON TABLE "public"."notifications" FROM "authenticated";

GRANT UPDATE ("read_at") ON TABLE "public"."notifications" TO "authenticated";

GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

REVOKE ALL ("display_name") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("display_name") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("preferences") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("preferences") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."profiles" TO "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."quiz_responses" FROM "authenticated";

GRANT SELECT ON TABLE "public"."quiz_responses" TO "authenticated";

REVOKE ALL ON TABLE "public"."quiz_responses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_responses" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_responses" TO "service_role";

REVOKE ALL ON TABLE "public"."school_members" FROM "authenticated";

GRANT SELECT ON TABLE "public"."school_members" TO "authenticated";

REVOKE ALL ON TABLE "public"."school_members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."school_members" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."school_members" TO "service_role";

REVOKE ALL ON TABLE "public"."schools" FROM "authenticated";

GRANT SELECT ON TABLE "public"."schools" TO "authenticated";

REVOKE ALL ON TABLE "public"."schools" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."schools" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."schools" TO "service_role";


-- Labora explicit release grants: do not rely on project default ACLs.
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to service_role;
revoke all on table public.profiles,public.schools,public.school_members,public.classes,public.class_members,public.invitations,public.experiments,public.experiment_versions,public.assignments,public.assignment_versions,public.assignment_targets,public.assignment_recipients,public.lab_sessions,public.lab_actions,public.quiz_responses,public.experiment_results,public.lab_notes,public.notifications from anon,authenticated;
grant select on public.experiments,public.experiment_versions to anon,authenticated;
grant select on public.profiles,public.schools,public.school_members,public.classes,public.class_members,public.invitations,public.assignment_versions,public.assignment_targets,public.assignment_recipients,public.lab_sessions,public.lab_actions,public.quiz_responses,public.experiment_results,public.lab_notes,public.notifications to authenticated;
grant select(id,school_id,teacher_id,experiment_id,title,status,due_at,published_version_id,revision,created_at,updated_at) on public.assignments to authenticated;
grant update(display_name,preferences,updated_at) on public.profiles to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant all on public.profiles,public.schools,public.school_members,public.classes,public.class_members,public.invitations,public.experiments,public.experiment_versions,public.assignments,public.assignment_versions,public.assignment_targets,public.assignment_recipients,public.lab_sessions,public.lab_actions,public.quiz_responses,public.experiment_results,public.lab_notes,public.notifications,private.answer_keys,private.rate_limits to service_role;
revoke all on private.answer_keys,private.rate_limits from public,anon,authenticated;
revoke execute on function public.labora_create_school(uuid,text),public.labora_accept_invitation(uuid,text,text),public.labora_answer_keys(uuid,uuid),public.labora_commit_event(uuid,uuid,uuid,integer,text,jsonb,jsonb,boolean,jsonb,jsonb),public.labora_submit(uuid,uuid,integer,jsonb),public.labora_publish(uuid,uuid,integer,jsonb,jsonb,uuid[]),public.labora_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.labora_create_school(uuid,text),public.labora_accept_invitation(uuid,text,text),public.labora_answer_keys(uuid,uuid),public.labora_commit_event(uuid,uuid,uuid,integer,text,jsonb,jsonb,boolean,jsonb,jsonb),public.labora_submit(uuid,uuid,integer,jsonb),public.labora_publish(uuid,uuid,integer,jsonb,jsonb,uuid[]),public.labora_rate_limit(text,integer) to service_role;
revoke execute on function private.bootstrap_profile(),private.immutable_record(),private.check_class_scope() from public,anon,authenticated;
insert into public.profiles(id,display_name) select id,left(coalesce(nullif(trim(raw_user_meta_data->>'name'),''),'Pelajar'),100) from auth.users on conflict(id) do nothing;
