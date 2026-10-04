-- LABORA: PostgreSQL 17 distribution dump for competition submission.
-- Exported 2026-10-04 from the local Supabase database using pg_dump 17.11.
-- Includes application schemas, access rules, functions, and 9 seeded experiments.
-- Includes catalog answer keys; never serve this file through the frontend/public folder.
-- Excludes real user accounts, sessions, classes, submissions, and credentials.
-- Target: a fresh Supabase PostgreSQL project with Auth/Storage schemas and built-in roles.
-- This replaces applying the seven Labora migrations; do not apply both to the same database.
-- Restore with psql -X --set ON_ERROR_STOP=on --single-transaction --file labora.sql.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

--
-- PostgreSQL database dump
--

\restrict Wgfb80lCq5Ve3rtwW0J2pAJc3Jrob7UYQ4po6SpGBhfqnHoEkWKjM1yjYl5bipz

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA private;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: bootstrap_profile(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.bootstrap_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Pelajar'),100));
  return new;
end $$;


--
-- Name: check_class_scope(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.check_class_scope() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  if tg_table_name='classes' then
    if not exists(select 1 from public.school_members where school_id=new.school_id and user_id=new.teacher_id and role='teacher' and status='active') then raise exception 'FORBIDDEN'; end if;
  else
    if not exists(select 1 from public.classes c join public.school_members m on m.school_id=c.school_id and m.user_id=new.student_id and m.role='student' and m.status='active' where c.id=new.class_id and c.archived_at is null) then raise exception 'FORBIDDEN'; end if;
  end if;
  return new;
end $$;


--
-- Name: immutable_record(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.immutable_record() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$ begin raise exception 'Published records are immutable'; end $$;


--
-- Name: labora_accept_invitation(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_accept_invitation(actor uuid, email_address text, digest text) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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
end $$;


--
-- Name: labora_answer_keys(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_answer_keys(version_id uuid, assignment_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE sql
    SET search_path TO ''
    AS $$
  select coalesce(jsonb_object_agg(question_key,jsonb_build_object('answer',correct_answer,'explanation',explanation)),'{}'::jsonb)
  from private.answer_keys where (assignment_id is null and experiment_version_id=version_id) or (assignment_id is not null and assignment_version_id=assignment_id);
$$;


--
-- Name: labora_assignment_report(uuid, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_assignment_report(actor uuid, assignment uuid, page_offset integer, page_limit integer) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: labora_commit_event(uuid, uuid, uuid, integer, text, jsonb, jsonb, boolean, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_commit_event(actor uuid, session uuid, event uuid, expected_revision integer, event_type text, event_payload jsonb, new_state jsonb, is_accepted boolean, response jsonb, quiz jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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
end $$;


--
-- Name: labora_create_school(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_create_school(actor uuid, school_name text) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare s public.schools; begin
  if (select count(*) from public.schools where owner_id=actor) >= 3 then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.schools(name,owner_id) values(school_name,actor) returning * into s;
  insert into public.school_members(school_id,user_id,role) values(s.id,actor,'teacher');
  update public.profiles set preferences=preferences || jsonb_build_object('active_school_id',s.id),updated_at=now() where id=actor;
  return to_jsonb(s);
end $$;


--
-- Name: labora_progress_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_progress_summary(actor uuid) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: labora_publish(uuid, uuid, integer, jsonb, jsonb, uuid[], uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_publish(actor uuid, assignment uuid, expected_revision integer, public_config jsonb, keys jsonb, classes uuid[], students uuid[] DEFAULT NULL::uuid[]) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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
end $$;


--
-- Name: labora_rate_limit(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_rate_limit(scope_key text, quota integer) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare count integer; begin
  if length(scope_key)>100 or quota<1 or quota>1000 then raise exception 'VALIDATION_ERROR'; end if;
  insert into private.rate_limits(scope,window_start) values(scope_key,date_trunc('minute',now())) on conflict(scope,window_start) do update set hits=private.rate_limits.hits+1 returning hits into count;
  delete from private.rate_limits where (scope,window_start) in (select scope,window_start from private.rate_limits where window_start<now()-interval '1 day' limit 100);
  return count<=quota;
end $$;


--
-- Name: labora_submit(uuid, uuid, integer, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.labora_submit(actor uuid, session uuid, expected_revision integer, assessment jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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
end $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answer_keys; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.answer_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experiment_version_id uuid,
    assignment_version_id uuid,
    question_key text NOT NULL,
    correct_answer jsonb NOT NULL,
    explanation text NOT NULL,
    rubric jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT answer_keys_check CHECK ((num_nonnulls(experiment_version_id, assignment_version_id) = 1))
);


--
-- Name: rate_limits; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.rate_limits (
    scope text NOT NULL,
    window_start timestamp with time zone NOT NULL,
    hits integer DEFAULT 1 NOT NULL
);


--
-- Name: assignment_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_recipients (
    assignment_version_id uuid NOT NULL,
    student_id uuid NOT NULL,
    source_class_id uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignment_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    class_id uuid,
    student_id uuid,
    CONSTRAINT assignment_targets_check CHECK ((num_nonnulls(class_id, student_id) = 1))
);


--
-- Name: assignment_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    version integer NOT NULL,
    experiment_version_id uuid NOT NULL,
    config jsonb NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    experiment_id text NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    due_at timestamp with time zone,
    draft_config jsonb NOT NULL,
    published_version_id uuid,
    revision integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assignments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT assignments_title_check CHECK (((length(title) >= 1) AND (length(title) <= 160)))
);


--
-- Name: class_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_members (
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    name text NOT NULL,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT classes_name_check CHECK (((length(name) >= 1) AND (length(name) <= 80)))
);


--
-- Name: experiment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    student_id uuid NOT NULL,
    experiment_version_id uuid NOT NULL,
    assignment_version_id uuid,
    experiment_accuracy integer NOT NULL,
    quiz_accuracy integer NOT NULL,
    score integer NOT NULL,
    steps_completed integer NOT NULL,
    steps_total integer NOT NULL,
    scoring_version integer DEFAULT 1 NOT NULL,
    observations jsonb NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT experiment_results_check CHECK (((steps_completed = steps_total) AND (steps_total > 0))),
    CONSTRAINT experiment_results_experiment_accuracy_check CHECK (((experiment_accuracy >= 0) AND (experiment_accuracy <= 100))),
    CONSTRAINT experiment_results_quiz_accuracy_check CHECK (((quiz_accuracy >= 0) AND (quiz_accuracy <= 100))),
    CONSTRAINT experiment_results_score_check CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT experiment_results_scoring_version_check CHECK ((scoring_version = 1))
);


--
-- Name: experiment_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiment_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experiment_id text NOT NULL,
    version integer NOT NULL,
    definition jsonb NOT NULL,
    engine_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT experiment_versions_definition_check CHECK ((jsonb_typeof(definition) = 'object'::text)),
    CONSTRAINT experiment_versions_engine_version_check CHECK ((engine_version = 1)),
    CONSTRAINT experiment_versions_version_check CHECK ((version > 0))
);


--
-- Name: experiments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiments (
    id text NOT NULL,
    subject text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    duration_minutes integer NOT NULL,
    current_version_id uuid,
    published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT experiments_duration_minutes_check CHECK ((duration_minutes > 0)),
    CONSTRAINT experiments_subject_check CHECK ((subject = ANY (ARRAY['chemistry'::text, 'physics'::text, 'biology'::text])))
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    class_id uuid,
    invited_email text,
    role text NOT NULL,
    token_hash text NOT NULL,
    created_by uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    max_uses integer NOT NULL,
    uses integer DEFAULT 0 NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT invitations_check CHECK (((uses >= 0) AND (uses <= max_uses))),
    CONSTRAINT invitations_check1 CHECK (((class_id IS NULL) OR (role = 'student'::text))),
    CONSTRAINT invitations_max_uses_check CHECK (((max_uses >= 1) AND (max_uses <= 1000))),
    CONSTRAINT invitations_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text])))
);


--
-- Name: lab_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    client_event_id uuid NOT NULL,
    sequence integer NOT NULL,
    action_type text NOT NULL,
    payload jsonb NOT NULL,
    accepted boolean NOT NULL,
    feedback text NOT NULL,
    outcome jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lab_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    author_id uuid NOT NULL,
    hypothesis text DEFAULT ''::text NOT NULL,
    observation text DEFAULT ''::text NOT NULL,
    conclusion text DEFAULT ''::text NOT NULL,
    measurement_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lab_notes_conclusion_check CHECK ((length(conclusion) <= 4000)),
    CONSTRAINT lab_notes_hypothesis_check CHECK ((length(hypothesis) <= 4000)),
    CONSTRAINT lab_notes_observation_check CHECK ((length(observation) <= 4000))
);


--
-- Name: lab_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    mode text NOT NULL,
    subject text NOT NULL,
    simulation_key text,
    experiment_version_id uuid,
    assignment_version_id uuid,
    status text DEFAULT 'active'::text NOT NULL,
    current_step integer DEFAULT 0 NOT NULL,
    state jsonb NOT NULL,
    state_version integer DEFAULT 1 NOT NULL,
    revision integer DEFAULT 0 NOT NULL,
    start_event_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_saved_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    CONSTRAINT lab_sessions_check CHECK ((((mode = 'guided'::text) AND (experiment_version_id IS NOT NULL)) OR ((mode = 'sandbox'::text) AND (experiment_version_id IS NULL) AND (assignment_version_id IS NULL)))),
    CONSTRAINT lab_sessions_current_step_check CHECK ((current_step >= 0)),
    CONSTRAINT lab_sessions_mode_check CHECK ((mode = ANY (ARRAY['guided'::text, 'sandbox'::text]))),
    CONSTRAINT lab_sessions_revision_check CHECK ((revision >= 0)),
    CONSTRAINT lab_sessions_state_version_check CHECK ((state_version = 1)),
    CONSTRAINT lab_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'submitted'::text, 'abandoned'::text]))),
    CONSTRAINT lab_sessions_subject_check CHECK ((subject = ANY (ARRAY['chemistry'::text, 'physics'::text, 'biology'::text, 'free'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    type text NOT NULL,
    assignment_version_id uuid,
    result_id uuid,
    dedupe_key text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['assignment'::text, 'result'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text NOT NULL,
    avatar_path text,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bounded_preferences CHECK ((octet_length((preferences)::text) <= 8192)),
    CONSTRAINT profiles_display_name_check CHECK (((length(display_name) >= 1) AND (length(display_name) <= 100))),
    CONSTRAINT profiles_preferences_check CHECK ((jsonb_typeof(preferences) = 'object'::text))
);


--
-- Name: quiz_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    question_key text NOT NULL,
    attempt_no integer NOT NULL,
    answer jsonb NOT NULL,
    is_correct boolean NOT NULL,
    points_awarded numeric NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quiz_responses_attempt_no_check CHECK ((attempt_no > 0)),
    CONSTRAINT quiz_responses_points_awarded_check CHECK (((points_awarded >= (0)::numeric) AND (points_awarded <= (1)::numeric)))
);


--
-- Name: school_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_members (
    school_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT school_members_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text]))),
    CONSTRAINT school_members_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT schools_name_check CHECK (((length(name) >= 1) AND (length(name) <= 120)))
);


--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA private TO service_role;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION bootstrap_profile(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.bootstrap_profile() FROM PUBLIC;


--
-- Name: FUNCTION check_class_scope(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.check_class_scope() FROM PUBLIC;


--
-- Name: FUNCTION immutable_record(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.immutable_record() FROM PUBLIC;


--
-- Name: FUNCTION labora_accept_invitation(actor uuid, email_address text, digest text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_accept_invitation(actor uuid, email_address text, digest text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_accept_invitation(actor uuid, email_address text, digest text) TO service_role;


--
-- Name: FUNCTION labora_answer_keys(version_id uuid, assignment_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_answer_keys(version_id uuid, assignment_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_answer_keys(version_id uuid, assignment_id uuid) TO service_role;


--
-- Name: FUNCTION labora_assignment_report(actor uuid, assignment uuid, page_offset integer, page_limit integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_assignment_report(actor uuid, assignment uuid, page_offset integer, page_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_assignment_report(actor uuid, assignment uuid, page_offset integer, page_limit integer) TO service_role;


--
-- Name: FUNCTION labora_commit_event(actor uuid, session uuid, event uuid, expected_revision integer, event_type text, event_payload jsonb, new_state jsonb, is_accepted boolean, response jsonb, quiz jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_commit_event(actor uuid, session uuid, event uuid, expected_revision integer, event_type text, event_payload jsonb, new_state jsonb, is_accepted boolean, response jsonb, quiz jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_commit_event(actor uuid, session uuid, event uuid, expected_revision integer, event_type text, event_payload jsonb, new_state jsonb, is_accepted boolean, response jsonb, quiz jsonb) TO service_role;


--
-- Name: FUNCTION labora_create_school(actor uuid, school_name text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_create_school(actor uuid, school_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_create_school(actor uuid, school_name text) TO service_role;


--
-- Name: FUNCTION labora_progress_summary(actor uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_progress_summary(actor uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_progress_summary(actor uuid) TO service_role;


--
-- Name: FUNCTION labora_publish(actor uuid, assignment uuid, expected_revision integer, public_config jsonb, keys jsonb, classes uuid[], students uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_publish(actor uuid, assignment uuid, expected_revision integer, public_config jsonb, keys jsonb, classes uuid[], students uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_publish(actor uuid, assignment uuid, expected_revision integer, public_config jsonb, keys jsonb, classes uuid[], students uuid[]) TO service_role;


--
-- Name: FUNCTION labora_rate_limit(scope_key text, quota integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_rate_limit(scope_key text, quota integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_rate_limit(scope_key text, quota integer) TO service_role;


--
-- Name: FUNCTION labora_submit(actor uuid, session uuid, expected_revision integer, assessment jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.labora_submit(actor uuid, session uuid, expected_revision integer, assessment jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.labora_submit(actor uuid, session uuid, expected_revision integer, assessment jsonb) TO service_role;


--
-- Name: TABLE answer_keys; Type: ACL; Schema: private; Owner: -
--

GRANT ALL ON TABLE private.answer_keys TO service_role;


--
-- Name: TABLE rate_limits; Type: ACL; Schema: private; Owner: -
--

GRANT ALL ON TABLE private.rate_limits TO service_role;


--
-- Name: TABLE assignment_recipients; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignment_recipients TO service_role;
GRANT SELECT ON TABLE public.assignment_recipients TO authenticated;


--
-- Name: TABLE assignment_targets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignment_targets TO service_role;
GRANT SELECT ON TABLE public.assignment_targets TO authenticated;


--
-- Name: TABLE assignment_versions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignment_versions TO service_role;
GRANT SELECT ON TABLE public.assignment_versions TO authenticated;


--
-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignments TO service_role;


--
-- Name: COLUMN assignments.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.school_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(school_id) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.teacher_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(teacher_id) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.experiment_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(experiment_id) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.title; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(title) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(status) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.due_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(due_at) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.published_version_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(published_version_id) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.revision; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(revision) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.assignments TO authenticated;


--
-- Name: COLUMN assignments.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at) ON TABLE public.assignments TO authenticated;


--
-- Name: TABLE class_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.class_members TO service_role;
GRANT SELECT ON TABLE public.class_members TO authenticated;


--
-- Name: TABLE classes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.classes TO service_role;
GRANT SELECT ON TABLE public.classes TO authenticated;


--
-- Name: TABLE experiment_results; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.experiment_results TO service_role;
GRANT SELECT ON TABLE public.experiment_results TO authenticated;


--
-- Name: TABLE experiment_versions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.experiment_versions TO service_role;
GRANT SELECT ON TABLE public.experiment_versions TO anon;
GRANT SELECT ON TABLE public.experiment_versions TO authenticated;


--
-- Name: TABLE experiments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.experiments TO service_role;
GRANT SELECT ON TABLE public.experiments TO anon;
GRANT SELECT ON TABLE public.experiments TO authenticated;


--
-- Name: TABLE invitations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.invitations TO service_role;
GRANT SELECT ON TABLE public.invitations TO authenticated;


--
-- Name: TABLE lab_actions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lab_actions TO service_role;
GRANT SELECT ON TABLE public.lab_actions TO authenticated;


--
-- Name: TABLE lab_notes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lab_notes TO service_role;
GRANT SELECT ON TABLE public.lab_notes TO authenticated;


--
-- Name: TABLE lab_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lab_sessions TO service_role;
GRANT SELECT ON TABLE public.lab_sessions TO authenticated;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT ON TABLE public.notifications TO authenticated;


--
-- Name: COLUMN notifications.read_at; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(read_at) ON TABLE public.notifications TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.display_name; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(display_name) ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.preferences; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(preferences) ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(updated_at) ON TABLE public.profiles TO authenticated;


--
-- Name: TABLE quiz_responses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.quiz_responses TO service_role;
GRANT SELECT ON TABLE public.quiz_responses TO authenticated;


--
-- Name: TABLE school_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.school_members TO service_role;
GRANT SELECT ON TABLE public.school_members TO authenticated;


--
-- Name: TABLE schools; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.schools TO service_role;
GRANT SELECT ON TABLE public.schools TO authenticated;


--
-- PostgreSQL database dump complete
--

\unrestrict Wgfb80lCq5Ve3rtwW0J2pAJc3Jrob7UYQ4po6SpGBhfqnHoEkWKjM1yjYl5bipz


-- Seeded experiment catalog
--
-- PostgreSQL database dump
--

\restrict 4MfuKyogbnjm7pqh2rTzHdjYncq5YKIH2goWz052OVn3RvI5Aix95c8hkh4pEEn

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: experiment_versions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('8582f67b-0545-4943-87bb-d5010c5041ee', 'acid-base', 1, '{"id": "acid-base", "items": [{"id": "beaker", "icon": "beaker", "kind": "tool", "name": "Gelas beker"}, {"id": "dropper", "icon": "dropper", "kind": "tool", "name": "Pipet tetes"}, {"id": "solution", "icon": "bottle", "kind": "material", "name": "Larutan A"}, {"id": "indicator", "icon": "drop", "kind": "material", "name": "Indikator pH"}], "steps": [{"hint": "Seret gelas beker dari daftar alat, atau pilih lalu letakkan di meja.", "item": "beaker", "action": "place", "instruction": "Letakkan gelas beker di meja laboratorium."}, {"hint": "Seret Larutan A langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tuang.", "item": "solution", "action": "pour", "instruction": "Tuang Larutan A ke dalam gelas beker."}, {"hint": "Seret indikator langsung ke gelas beker, atau pilih indikatornya lalu jalankan aksi tambah.", "item": "indicator", "action": "add", "instruction": "Tambahkan indikator pH ke dalam larutan."}, {"hint": "Bandingkan warna merah dengan nilai pH yang ditampilkan.", "action": "answer", "question": {"phase": "during", "prompt": "Mengapa indikator berubah warna?", "options": ["Suhu larutan berubah", "Molekul indikator merespons konsentrasi ion hidrogen", "Gelas beker bereaksi dengan cairan", "Warna merah selalu berarti netral"]}, "instruction": "Amati warnanya dan tentukan sifat Larutan A."}], "title": "Identifikasi Asam dan Basa", "theory": "Indikator berubah warna karena bentuk molekulnya berubah sesuai konsentrasi ion hidrogen. pH rendah bersifat asam, sedangkan pH tinggi bersifat basa. Bagan warna membantu kita memperkirakan pH tanpa alat ukur.", "visual": "ph", "concept": "Indikator berubah menjadi merah dalam larutan asam dengan pH sekitar 3.", "subject": "chemistry", "duration": 12, "subtitle": "Kenali sifat larutan dari warnanya", "equipment": ["Gelas beker", "Pipet tetes", "Bagan pH"], "materials": ["Larutan A", "Indikator universal"], "objective": "Identifikasi sifat larutan menggunakan indikator pH universal."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('72ebb5b9-9983-485f-b13f-c03a41ab77f5', 'mixture', 1, '{"id": "mixture", "items": [{"id": "beaker", "icon": "beaker", "kind": "tool", "name": "Gelas beker"}, {"id": "solution", "icon": "bottle", "kind": "material", "name": "Larutan A"}, {"id": "reagent", "icon": "bottle", "kind": "material", "name": "Larutan B"}], "steps": [{"hint": "Pilih gelas beker dari daftar alat lalu letakkan di meja.", "item": "beaker", "action": "place", "instruction": "Letakkan gelas beker di meja."}, {"hint": "Seret Larutan A langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tuang.", "item": "solution", "action": "pour", "instruction": "Tuang Larutan A ke dalam gelas beker."}, {"hint": "Seret Larutan B langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tambah.", "item": "reagent", "action": "add", "instruction": "Tambahkan Larutan B dan amati perubahannya."}, {"hint": "Perhatikan padatan yang membuat larutan keruh.", "action": "answer", "question": {"phase": "during", "prompt": "Apa nama padatan yang membuat larutan keruh?", "options": ["Endapan", "Pelarut", "Indikator", "Gas"]}, "instruction": "Kenali tanda terbentuknya zat baru."}], "title": "Reaksi Pembentukan Endapan", "theory": "Saat ion-ion terlarut bergabung membentuk senyawa yang tidak larut, muncul padatan berupa endapan. Perubahan yang terlihat ini merupakan bukti terjadinya reaksi kimia.", "visual": "mixture", "concept": "Campuran kedua larutan membentuk endapan yang membuatnya keruh.", "subject": "chemistry", "duration": 10, "subtitle": "Amati endapan yang terbentuk", "equipment": ["Gelas beker", "Pipet tetes"], "materials": ["Larutan A", "Larutan B"], "objective": "Kenali tanda terbentuknya zat baru saat dua larutan dicampurkan."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('bc2f3217-c8c3-4caa-bfcb-d94e1c7a4224', 'dilution', 1, '{"id": "dilution", "items": [{"id": "cylinder", "icon": "cylinder", "kind": "tool", "name": "Gelas ukur"}, {"id": "concentrate", "icon": "bottle", "kind": "material", "name": "Larutan pekat"}, {"id": "water", "icon": "drop", "kind": "material", "name": "Air"}], "steps": [{"hint": "Pilih gelas ukur lalu letakkan di meja.", "item": "cylinder", "action": "place", "instruction": "Letakkan gelas ukur di meja."}, {"hint": "Seret larutan pekat langsung ke gelas ukur, atau pilih larutannya lalu jalankan aksi tambah.", "item": "concentrate", "action": "add", "instruction": "Tambahkan larutan pekat ke dalam gelas ukur."}, {"hint": "Seret air langsung ke gelas ukur, atau pilih air lalu jalankan aksi tambah.", "item": "water", "action": "add", "instruction": "Tambahkan air hingga volume menjadi dua kali lipat."}, {"hint": "Gunakan hubungan Câ‚Vâ‚ = Câ‚‚Vâ‚‚.", "action": "answer", "question": {"phase": "during", "prompt": "Jika volume menjadi dua kali lipat, konsentrasinya menjadi berapa?", "options": ["Dua kali lipat", "Setengahnya", "Tetap", "Nol"]}, "instruction": "Periksa konsentrasi setelah pengenceran."}], "title": "Pengenceran dan Konsentrasi", "theory": "Pengenceran menyebarkan jumlah zat terlarut yang sama dalam volume yang lebih besar. Câ‚Vâ‚ = Câ‚‚Vâ‚‚.", "visual": "dilution", "concept": "Jika volume total menjadi dua kali lipat, konsentrasi menjadi setengahnya.", "subject": "chemistry", "duration": 10, "subtitle": "Buat larutan menjadi lebih encer", "equipment": ["Gelas ukur", "Gelas beker"], "materials": ["Larutan pekat", "Air"], "objective": "Amati perubahan konsentrasi saat air ditambahkan tanpa mengubah jumlah zat terlarut."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('9ec8748b-8b9b-48bd-b88b-a38f7346f52b', 'ohms-law', 1, '{"id": "ohms-law", "items": [{"id": "battery", "icon": "battery", "kind": "tool", "name": "Baterai"}, {"id": "resistor", "icon": "resistor", "kind": "tool", "name": "Resistor"}, {"id": "wire", "icon": "wire", "kind": "tool", "name": "Kabel"}, {"id": "lamp", "icon": "lamp", "kind": "tool", "name": "Lampu"}, {"id": "ammeter", "icon": "meter", "kind": "tool", "name": "Amperemeter"}], "steps": [{"hint": "Seret baterai ke papan rangkaian.", "item": "battery", "action": "place", "instruction": "Letakkan baterai sebagai sumber listrik rangkaian."}, {"hint": "Letakkan resistor di papan rangkaian.", "item": "resistor", "action": "place", "instruction": "Pasang resistor untuk mengatur kuat arus."}, {"hint": "Letakkan lampu di papan rangkaian.", "item": "lamp", "action": "place", "instruction": "Pasang lampu agar aliran arus terlihat."}, {"hint": "Letakkan kabel untuk menutup rangkaian.", "item": "wire", "action": "place", "instruction": "Hubungkan komponen dengan kabel."}, {"hint": "Gunakan I = V / R. Coba geser pengatur tegangan dan hambatan.", "action": "answer", "question": {"phase": "during", "prompt": "Pada tegangan 6 V dan hambatan 3 Î©, berapa kuat arusnya?", "options": ["0.5 A", "2 A", "3 A", "18 A"]}, "instruction": "Atur tegangan dan hambatan, lalu hitung kuat arus."}], "title": "Rangkaian Hukum Ohm", "theory": "Hukum Ohm menghubungkan tegangan, kuat arus, dan hambatan: I = V / R. Menaikkan tegangan memperbesar arus, sedangkan menaikkan hambatan memperkecilnya. Arus hanya mengalir jika rangkaian tertutup.", "visual": "circuit", "concept": "Pada rangkaian tertutup, kuat arus sama dengan tegangan dibagi hambatan.", "subject": "physics", "duration": 15, "subtitle": "Susun rangkaian dan amati arus listrik", "equipment": ["Baterai", "Resistor", "Kabel", "Lampu", "Amperemeter"], "materials": [], "objective": "Pelajari bagaimana tegangan dan hambatan menentukan kuat arus listrik."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('1dfb5fe8-b353-4b7b-a9fd-e096774b7afd', 'projectile', 1, '{"id": "projectile", "items": [{"id": "launcher", "icon": "launcher", "kind": "tool", "name": "Pelontar"}, {"id": "ball", "icon": "ball", "kind": "material", "name": "Bola"}], "steps": [{"hint": "Pilih pelontar lalu letakkan di lapangan.", "item": "launcher", "action": "place", "instruction": "Letakkan pelontar di lapangan."}, {"hint": "Pilih bola lalu letakkan di area percobaan.", "item": "ball", "action": "place", "instruction": "Masukkan bola ke pelontar."}, {"hint": "Pilih pelontar lalu jalankan aksi luncurkan.", "item": "launcher", "action": "activate", "instruction": "Luncurkan bola dan amati lintasannya."}, {"hint": "Pikirkan keseimbangan antara kecepatan vertikal dan horizontal.", "action": "answer", "question": {"phase": "during", "prompt": "Sudut ideal mana yang menghasilkan jangkauan terjauh pada permukaan datar?", "options": ["15Â°", "30Â°", "45Â°", "90Â°"]}, "instruction": "Prediksi sudut dengan jangkauan terjauh."}], "title": "Gerak Parabola", "theory": "Tanpa hambatan udara, jarak jangkauan horizontal adalah R = vÂ² sin(2Î¸) / g. Pada permukaan datar, jangkauan terbesar terjadi pada sudut sekitar 45Â°.", "visual": "projectile", "concept": "Sudut peluncuran 45Â° menghasilkan jangkauan ideal terbesar.", "subject": "physics", "duration": 12, "subtitle": "Luncurkan, ukur, dan bandingkan", "equipment": ["Pelontar", "Penanda jarak"], "materials": ["Bola"], "objective": "Amati pengaruh sudut peluncuran terhadap jarak jangkauan pada kecepatan awal yang tetap."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('112b1195-833c-4d04-855b-fce39654ee2d', 'pendulum', 1, '{"id": "pendulum", "items": [{"id": "stand", "icon": "stand", "kind": "tool", "name": "Statif"}, {"id": "bob", "icon": "ball", "kind": "tool", "name": "Beban bandul"}], "steps": [{"hint": "Letakkan statif di meja.", "item": "stand", "action": "place", "instruction": "Siapkan statif untuk bandul."}, {"hint": "Pilih beban bandul lalu letakkan di area percobaan.", "item": "bob", "action": "place", "instruction": "Pasang beban bandul."}, {"hint": "Pilih beban bandul lalu jalankan aksi lepaskan.", "item": "bob", "action": "activate", "instruction": "Lepaskan bandul agar mulai berayun."}, {"hint": "Coba geser pengatur panjang tali.", "action": "answer", "question": {"phase": "during", "prompt": "Apa yang terjadi jika panjang bandul bertambah?", "options": ["Periodenya bertambah", "Periodenya menjadi nol", "Massanya menghilang", "Periodenya tetap"]}, "instruction": "Bandingkan periode pada panjang bandul yang berbeda."}], "title": "Bandul Sederhana", "theory": "Untuk ayunan kecil, periode T â‰ˆ 2Ï€âˆš(L/g). Bandul yang lebih panjang berayun lebih lambat.", "visual": "pendulum", "concept": "Bandul yang lebih panjang memiliki periode lebih lama.", "subject": "physics", "duration": 10, "subtitle": "Temukan pola ayunan bandul", "equipment": ["Statif", "Beban bandul"], "materials": [], "objective": "Amati pengaruh panjang bandul terhadap periode ayunannya."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('312679a9-cb05-40cb-bb8b-378ee2d1706a', 'microscope', 1, '{"id": "microscope", "items": [{"id": "microscope", "icon": "microscope", "kind": "tool", "name": "Mikroskop"}, {"id": "slide", "icon": "slide", "kind": "tool", "name": "Kaca objek"}, {"id": "sample", "icon": "leaf", "kind": "material", "name": "Sampel tumbuhan"}, {"id": "water", "icon": "drop", "kind": "material", "name": "Tetes air"}], "steps": [{"hint": "Pilih kaca objek lalu letakkan di area percobaan.", "item": "slide", "action": "place", "instruction": "Letakkan kaca objek di baki preparat."}, {"hint": "Letakkan sampel tumbuhan di meja, lalu pilih dan tambahkan ke kaca objek.", "item": "sample", "action": "add", "instruction": "Tambahkan sampel tumbuhan yang tipis ke kaca objek."}, {"hint": "Letakkan tetes air di meja, lalu pilih dan tambahkan ke preparat.", "item": "water", "action": "add", "instruction": "Tambahkan setetes air untuk membuat preparat basah."}, {"hint": "Pilih mikroskop lalu letakkan di meja.", "item": "microscope", "action": "place", "instruction": "Letakkan mikroskop di samping kaca objek."}, {"hint": "Pilih mikroskop lalu jalankan aksi amati.", "item": "microscope", "action": "activate", "instruction": "Masukkan preparat dan atur fokus mikroskop."}, {"hint": "Cari struktur bulat di dekat bagian tengah setiap sel.", "action": "answer", "question": {"phase": "during", "prompt": "Struktur mana yang mengatur aktivitas di dalam sel?", "options": ["Dinding sel", "Inti sel", "Vakuola", "Sitoplasma"]}, "instruction": "Kenali struktur yang mengatur aktivitas sel."}], "title": "Pengamatan Sel dengan Mikroskop", "theory": "Mikroskop memperbesar struktur yang kecil. Preparat basah menempatkan sampel tipis di bawah kaca penutup. Pada sel tumbuhan, kita dapat melihat dinding sel, sitoplasma, dan inti sel. Perbesaran yang lebih tinggi memperlihatkan lebih banyak detail, tetapi bidang pandangnya lebih sempit.", "visual": "cell", "concept": "Inti sel membantu mengatur aktivitas sel.", "subject": "biology", "duration": 14, "subtitle": "Siapkan preparat dan amati sel", "equipment": ["Mikroskop", "Kaca objek", "Pipet tetes"], "materials": ["Sampel tumbuhan", "Air"], "objective": "Siapkan preparat dan kenali struktur sel tumbuhan yang terlihat."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('a37de322-ae38-43fd-8279-12b8fac0d60a', 'transpiration', 1, '{"id": "transpiration", "items": [{"id": "plant", "icon": "leaf", "kind": "material", "name": "Tumbuhan"}, {"id": "bag", "icon": "bag", "kind": "tool", "name": "Kantong bening"}, {"id": "water", "icon": "drop", "kind": "material", "name": "Air"}], "steps": [{"hint": "Pilih tumbuhan lalu letakkan di meja.", "item": "plant", "action": "place", "instruction": "Letakkan tumbuhan di meja."}, {"hint": "Letakkan air di meja, lalu pilih dan jalankan aksi tambah.", "item": "water", "action": "add", "instruction": "Siram tumbuhan dengan air."}, {"hint": "Pilih kantong bening lalu letakkan di area percobaan.", "item": "bag", "action": "place", "instruction": "Bungkus daun dengan kantong bening."}, {"hint": "Tetesan tersebut berasal dari tumbuhan.", "action": "answer", "question": {"phase": "during", "prompt": "Dari mana asal air di dalam kantong?", "options": ["Daun melepaskan uap air", "Kantong menghasilkan air", "Sinar matahari berubah menjadi air", "Tanah berubah menjadi plastik"]}, "instruction": "Amati tetesan air di dalam kantong."}], "title": "Transpirasi Tumbuhan", "theory": "Air bergerak dari akar ke daun, lalu menguap melalui stomata. Daun yang dibungkus dapat menghasilkan tetesan air dari uap yang mengembun.", "visual": "plant", "concept": "Transpirasi melepaskan uap air melalui daun.", "subject": "biology", "duration": 11, "subtitle": "Lacak air yang keluar dari daun", "equipment": ["Tumbuhan", "Kantong bening"], "materials": ["Air"], "objective": "Pahami bagaimana tumbuhan melepaskan uap air melalui stomata."}', 1, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiment_versions (id, experiment_id, version, definition, engine_version, created_at) VALUES ('198c61c8-ff9b-4a35-bd65-118be35ac0b6', 'blood-cells', 1, '{"id": "blood-cells", "items": [{"id": "microscope", "icon": "microscope", "kind": "tool", "name": "Mikroskop"}, {"id": "slide", "icon": "slide", "kind": "tool", "name": "Preparat apusan darah"}], "steps": [{"hint": "Pilih preparat apusan darah lalu letakkan di meja.", "item": "slide", "action": "place", "instruction": "Letakkan preparat apusan darah."}, {"hint": "Pilih mikroskop lalu letakkan di meja.", "item": "microscope", "action": "place", "instruction": "Letakkan mikroskop di meja."}, {"hint": "Pilih mikroskop lalu jalankan aksi amati.", "item": "microscope", "action": "activate", "instruction": "Atur fokus untuk mengamati preparat."}, {"hint": "Cari sel berbentuk cakram merah yang jumlahnya paling banyak.", "action": "answer", "question": {"phase": "during", "prompt": "Sel mana yang membawa sebagian besar oksigen?", "options": ["Trombosit", "Sel darah putih", "Sel darah merah", "Plasma"]}, "instruction": "Kenali sel yang membawa oksigen."}], "title": "Identifikasi Sel Darah", "theory": "Sel darah merah membawa oksigen, sel darah putih membantu pertahanan tubuh, dan trombosit membantu pembekuan darah.", "visual": "blood", "concept": "Komponen darah memiliki fungsi yang berbeda-beda.", "subject": "biology", "duration": 9, "subtitle": "Kenali sel dari bentuknya", "equipment": ["Mikroskop", "Preparat apusan darah"], "materials": [], "objective": "Bedakan sel darah merah, sel darah putih, dan trombosit."}', 1, '2026-10-03 17:50:11.632175+00');


--
-- Data for Name: experiments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('acid-base', 'chemistry', 'Identifikasi Asam dan Basa', 'Kenali sifat larutan dari warnanya', 12, '8582f67b-0545-4943-87bb-d5010c5041ee', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('mixture', 'chemistry', 'Reaksi Pembentukan Endapan', 'Amati endapan yang terbentuk', 10, '72ebb5b9-9983-485f-b13f-c03a41ab77f5', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('dilution', 'chemistry', 'Pengenceran dan Konsentrasi', 'Buat larutan menjadi lebih encer', 10, 'bc2f3217-c8c3-4caa-bfcb-d94e1c7a4224', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('ohms-law', 'physics', 'Rangkaian Hukum Ohm', 'Susun rangkaian dan amati arus listrik', 15, '9ec8748b-8b9b-48bd-b88b-a38f7346f52b', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('projectile', 'physics', 'Gerak Parabola', 'Luncurkan, ukur, dan bandingkan', 12, '1dfb5fe8-b353-4b7b-a9fd-e096774b7afd', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('pendulum', 'physics', 'Bandul Sederhana', 'Temukan pola ayunan bandul', 10, '112b1195-833c-4d04-855b-fce39654ee2d', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('microscope', 'biology', 'Pengamatan Sel dengan Mikroskop', 'Siapkan preparat dan amati sel', 14, '312679a9-cb05-40cb-bb8b-378ee2d1706a', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('transpiration', 'biology', 'Transpirasi Tumbuhan', 'Lacak air yang keluar dari daun', 11, 'a37de322-ae38-43fd-8279-12b8fac0d60a', true, '2026-10-03 17:50:11.632175+00');
INSERT INTO public.experiments (id, subject, title, summary, duration_minutes, current_version_id, published, created_at) VALUES ('blood-cells', 'biology', 'Identifikasi Sel Darah', 'Kenali sel dari bentuknya', 9, '198c61c8-ff9b-4a35-bd65-118be35ac0b6', true, '2026-10-03 17:50:11.632175+00');


--
-- PostgreSQL database dump complete
--

\unrestrict 4MfuKyogbnjm7pqh2rTzHdjYncq5YKIH2goWz052OVn3RvI5Aix95c8hkh4pEEn



-- Catalog-only private answer keys
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('7d9a1927-f7ab-4fee-89fa-12bc6819dd46', '112b1195-833c-4d04-855b-fce39654ee2d', NULL, '3', '0', 'Periode bertambah sebanding dengan akar kuadrat panjang bandul.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('c797e1f5-268f-4c26-8be8-b028afd03cab', '198c61c8-ff9b-4a35-bd65-118be35ac0b6', NULL, '3', '2', 'Sel darah merah mengandung hemoglobin yang membawa oksigen.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('180818ec-79c0-4228-8195-4dc150aa0b68', '1dfb5fe8-b353-4b7b-a9fd-e096774b7afd', NULL, '3', '2', 'Pada sudut 45Â°, sin(2Î¸) mencapai nilai maksimum, yaitu 1.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('6412c38e-f884-483a-a908-0be7a257dcfe', '72ebb5b9-9983-485f-b13f-c03a41ab77f5', NULL, '3', '0', 'Padatan yang tidak larut dan terbentuk saat reaksi disebut endapan.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('b84bd8fe-8081-444c-b155-89c4a1f5c9ad', '8582f67b-0545-4943-87bb-d5010c5041ee', NULL, '3', '1', 'Bentuk molekul indikator berbeda pada pH yang berbeda. Dalam larutan asam ini, bentuk yang terlihat berwarna merah.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('d3057138-f32b-4d8c-8a03-400928c07db4', 'a37de322-ae38-43fd-8279-12b8fac0d60a', NULL, '3', '0', 'Daun melepaskan uap air melalui stomata. Uap tersebut mengembun pada kantong.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('fbac9a3f-9f4f-4f49-b0dc-b5a3c8cce639', 'bc2f3217-c8c3-4caa-bfcb-d94e1c7a4224', NULL, '3', '1', 'Jumlah zat terlarut tetap, tetapi volumenya menjadi dua kali lipat. Jadi, konsentrasinya menjadi setengahnya.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('be014c66-d5e6-42cc-a2ea-8202f75bf3f3', '9ec8748b-8b9b-48bd-b88b-a38f7346f52b', NULL, '4', '1', 'Kuat arus sama dengan tegangan dibagi hambatan: 6 Ã· 3 = 2 A.', '{}');
INSERT INTO private.answer_keys ("id", "experiment_version_id", "assignment_version_id", "question_key", "correct_answer", "explanation", "rubric") VALUES ('a37ec853-35e4-4f7b-9ee8-e31434690db5', '312679a9-cb05-40cb-bb8b-378ee2d1706a', NULL, '5', '1', 'Inti sel mengandung DNA dan membantu mengatur aktivitas sel.', '{}');


--
-- PostgreSQL database dump
--

\restrict 6gcMdEPGG6JQfBaKUXHhM4rWqXNX1DOoMdd90cjedOqucyMRkEnopCibCXLYzrK

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

--
-- Name: answer_keys answer_keys_assignment_version_id_question_key_key; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.answer_keys
    ADD CONSTRAINT answer_keys_assignment_version_id_question_key_key UNIQUE (assignment_version_id, question_key);


--
-- Name: answer_keys answer_keys_experiment_version_id_question_key_key; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.answer_keys
    ADD CONSTRAINT answer_keys_experiment_version_id_question_key_key UNIQUE (experiment_version_id, question_key);


--
-- Name: answer_keys answer_keys_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.answer_keys
    ADD CONSTRAINT answer_keys_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (scope, window_start);


--
-- Name: assignment_recipients assignment_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_recipients
    ADD CONSTRAINT assignment_recipients_pkey PRIMARY KEY (assignment_version_id, student_id);


--
-- Name: assignment_targets assignment_targets_assignment_id_class_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_assignment_id_class_id_key UNIQUE (assignment_id, class_id);


--
-- Name: assignment_targets assignment_targets_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- Name: assignment_targets assignment_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_pkey PRIMARY KEY (id);


--
-- Name: assignment_versions assignment_versions_assignment_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_assignment_id_version_key UNIQUE (assignment_id, version);


--
-- Name: assignment_versions assignment_versions_id_assignment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_id_assignment_id_key UNIQUE (id, assignment_id);


--
-- Name: assignment_versions assignment_versions_id_experiment_version_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_id_experiment_version_id_key UNIQUE (id, experiment_version_id);


--
-- Name: assignment_versions assignment_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: class_members class_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT class_members_pkey PRIMARY KEY (class_id, student_id);


--
-- Name: classes classes_id_school_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_id_school_id_key UNIQUE (id, school_id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: experiment_results experiment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_pkey PRIMARY KEY (id);


--
-- Name: experiment_results experiment_results_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_session_id_key UNIQUE (session_id);


--
-- Name: experiment_versions experiment_versions_experiment_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_versions
    ADD CONSTRAINT experiment_versions_experiment_id_version_key UNIQUE (experiment_id, version);


--
-- Name: experiment_versions experiment_versions_id_experiment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_versions
    ADD CONSTRAINT experiment_versions_id_experiment_id_key UNIQUE (id, experiment_id);


--
-- Name: experiment_versions experiment_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_versions
    ADD CONSTRAINT experiment_versions_pkey PRIMARY KEY (id);


--
-- Name: experiments experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_hash_key UNIQUE (token_hash);


--
-- Name: lab_actions lab_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_actions
    ADD CONSTRAINT lab_actions_pkey PRIMARY KEY (id);


--
-- Name: lab_actions lab_actions_session_id_client_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_actions
    ADD CONSTRAINT lab_actions_session_id_client_event_id_key UNIQUE (session_id, client_event_id);


--
-- Name: lab_actions lab_actions_session_id_sequence_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_actions
    ADD CONSTRAINT lab_actions_session_id_sequence_key UNIQUE (session_id, sequence);


--
-- Name: lab_notes lab_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_notes
    ADD CONSTRAINT lab_notes_pkey PRIMARY KEY (id);


--
-- Name: lab_sessions lab_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_pkey PRIMARY KEY (id);


--
-- Name: lab_sessions lab_sessions_student_id_start_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_student_id_start_event_id_key UNIQUE (student_id, start_event_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_recipient_id_dedupe_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_dedupe_key_key UNIQUE (recipient_id, dedupe_key);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quiz_responses quiz_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_pkey PRIMARY KEY (id);


--
-- Name: quiz_responses quiz_responses_session_id_question_key_attempt_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_session_id_question_key_attempt_no_key UNIQUE (session_id, question_key, attempt_no);


--
-- Name: school_members school_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_members
    ADD CONSTRAINT school_members_pkey PRIMARY KEY (school_id, user_id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: assignment_versions_experiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_versions_experiment ON public.assignment_versions USING btree (experiment_version_id);


--
-- Name: assignments_experiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_experiment ON public.assignments USING btree (experiment_id);


--
-- Name: assignments_published_version_identity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_published_version_identity ON public.assignments USING btree (published_version_id, id);


--
-- Name: assignments_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_school ON public.assignments USING btree (school_id);


--
-- Name: assignments_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_teacher ON public.assignments USING btree (teacher_id, status, created_at DESC);


--
-- Name: assignments_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_version ON public.assignments USING btree (published_version_id);


--
-- Name: class_members_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_members_student ON public.class_members USING btree (student_id) WHERE (left_at IS NULL);


--
-- Name: classes_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX classes_school ON public.classes USING btree (school_id);


--
-- Name: classes_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX classes_teacher ON public.classes USING btree (teacher_id, school_id);


--
-- Name: experiments_current_version_identity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experiments_current_version_identity ON public.experiments USING btree (current_version_id, id);


--
-- Name: experiments_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experiments_version ON public.experiments USING btree (current_version_id);


--
-- Name: invitations_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_class ON public.invitations USING btree (class_id, school_id);


--
-- Name: invitations_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_creator ON public.invitations USING btree (created_by);


--
-- Name: invitations_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_school ON public.invitations USING btree (school_id);


--
-- Name: members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_user ON public.school_members USING btree (user_id, status, joined_at);


--
-- Name: notes_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_author ON public.lab_notes USING btree (author_id, updated_at DESC);


--
-- Name: notes_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_session ON public.lab_notes USING btree (session_id);


--
-- Name: notifications_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_assignment ON public.notifications USING btree (assignment_version_id);


--
-- Name: notifications_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_result ON public.notifications USING btree (result_id);


--
-- Name: notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread ON public.notifications USING btree (recipient_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: recipients_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipients_class ON public.assignment_recipients USING btree (source_class_id);


--
-- Name: recipients_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recipients_student ON public.assignment_recipients USING btree (student_id, assigned_at DESC);


--
-- Name: results_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX results_assignment ON public.experiment_results USING btree (assignment_version_id, score DESC);


--
-- Name: results_experiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX results_experiment ON public.experiment_results USING btree (experiment_version_id);


--
-- Name: results_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX results_student ON public.experiment_results USING btree (student_id, completed_at DESC);


--
-- Name: schools_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schools_owner ON public.schools USING btree (owner_id);


--
-- Name: sessions_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_assignment ON public.lab_sessions USING btree (assignment_version_id);


--
-- Name: sessions_assignment_experiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_assignment_experiment ON public.lab_sessions USING btree (assignment_version_id, experiment_version_id);


--
-- Name: sessions_assignment_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_assignment_student ON public.lab_sessions USING btree (assignment_version_id, student_id);


--
-- Name: sessions_experiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_experiment ON public.lab_sessions USING btree (experiment_version_id);


--
-- Name: sessions_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_student ON public.lab_sessions USING btree (student_id, last_saved_at DESC);


--
-- Name: targets_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX targets_class ON public.assignment_targets USING btree (class_id);


--
-- Name: targets_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX targets_student ON public.assignment_targets USING btree (student_id);


--
-- Name: lab_actions immutable_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER immutable_action BEFORE DELETE OR UPDATE ON public.lab_actions FOR EACH ROW EXECUTE FUNCTION private.immutable_record();


--
-- Name: assignment_versions immutable_assignment_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER immutable_assignment_version BEFORE DELETE OR UPDATE ON public.assignment_versions FOR EACH ROW EXECUTE FUNCTION private.immutable_record();


--
-- Name: experiment_versions immutable_experiment_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER immutable_experiment_version BEFORE DELETE OR UPDATE ON public.experiment_versions FOR EACH ROW EXECUTE FUNCTION private.immutable_record();


--
-- Name: quiz_responses immutable_response; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER immutable_response BEFORE DELETE OR UPDATE ON public.quiz_responses FOR EACH ROW EXECUTE FUNCTION private.immutable_record();


--
-- Name: experiment_results immutable_result; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER immutable_result BEFORE DELETE OR UPDATE ON public.experiment_results FOR EACH ROW EXECUTE FUNCTION private.immutable_record();


--
-- Name: class_members validate_class_student; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_class_student BEFORE INSERT OR UPDATE ON public.class_members FOR EACH ROW EXECUTE FUNCTION private.check_class_scope();


--
-- Name: classes validate_class_teacher; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_class_teacher BEFORE INSERT OR UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION private.check_class_scope();


--
-- Name: answer_keys answer_keys_assignment_version_id_fkey; Type: FK CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.answer_keys
    ADD CONSTRAINT answer_keys_assignment_version_id_fkey FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);


--
-- Name: answer_keys answer_keys_experiment_version_id_fkey; Type: FK CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.answer_keys
    ADD CONSTRAINT answer_keys_experiment_version_id_fkey FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);


--
-- Name: assignment_recipients assignment_recipients_assignment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_recipients
    ADD CONSTRAINT assignment_recipients_assignment_version_id_fkey FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);


--
-- Name: assignment_recipients assignment_recipients_source_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_recipients
    ADD CONSTRAINT assignment_recipients_source_class_id_fkey FOREIGN KEY (source_class_id) REFERENCES public.classes(id);


--
-- Name: assignment_recipients assignment_recipients_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_recipients
    ADD CONSTRAINT assignment_recipients_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: assignment_targets assignment_targets_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- Name: assignment_targets assignment_targets_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: assignment_targets assignment_targets_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_targets
    ADD CONSTRAINT assignment_targets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: assignment_versions assignment_versions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- Name: assignment_versions assignment_versions_experiment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_versions
    ADD CONSTRAINT assignment_versions_experiment_version_id_fkey FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);


--
-- Name: assignments assignments_experiment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.experiments(id);


--
-- Name: assignments assignments_published_version_id_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_published_version_id_id_fkey FOREIGN KEY (published_version_id, id) REFERENCES public.assignment_versions(id, assignment_id);


--
-- Name: assignments assignments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: assignments assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);


--
-- Name: class_members class_members_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: class_members class_members_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT class_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: classes classes_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);


--
-- Name: experiment_results experiment_results_assignment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_assignment_version_id_fkey FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);


--
-- Name: experiment_results experiment_results_experiment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_experiment_version_id_fkey FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);


--
-- Name: experiment_results experiment_results_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);


--
-- Name: experiment_results experiment_results_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_results
    ADD CONSTRAINT experiment_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: experiment_versions experiment_versions_experiment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiment_versions
    ADD CONSTRAINT experiment_versions_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.experiments(id);


--
-- Name: experiments experiments_current_version_id_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_current_version_id_id_fkey FOREIGN KEY (current_version_id, id) REFERENCES public.experiment_versions(id, experiment_id);


--
-- Name: invitations invitations_class_id_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_class_id_school_id_fkey FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id);


--
-- Name: invitations invitations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: invitations invitations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: lab_actions lab_actions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_actions
    ADD CONSTRAINT lab_actions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);


--
-- Name: lab_notes lab_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_notes
    ADD CONSTRAINT lab_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: lab_notes lab_notes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_notes
    ADD CONSTRAINT lab_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);


--
-- Name: lab_sessions lab_sessions_assignment_version_id_experiment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_assignment_version_id_experiment_version_id_fkey FOREIGN KEY (assignment_version_id, experiment_version_id) REFERENCES public.assignment_versions(id, experiment_version_id);


--
-- Name: lab_sessions lab_sessions_assignment_version_id_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_assignment_version_id_student_id_fkey FOREIGN KEY (assignment_version_id, student_id) REFERENCES public.assignment_recipients(assignment_version_id, student_id);


--
-- Name: lab_sessions lab_sessions_experiment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_experiment_version_id_fkey FOREIGN KEY (experiment_version_id) REFERENCES public.experiment_versions(id);


--
-- Name: lab_sessions lab_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_sessions
    ADD CONSTRAINT lab_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: notifications notifications_assignment_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_assignment_version_id_fkey FOREIGN KEY (assignment_version_id) REFERENCES public.assignment_versions(id);


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id);


--
-- Name: notifications notifications_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.experiment_results(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: quiz_responses quiz_responses_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.lab_sessions(id);


--
-- Name: school_members school_members_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_members
    ADD CONSTRAINT school_members_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: school_members school_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_members
    ADD CONSTRAINT school_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: schools schools_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);


--
-- Name: answer_keys; Type: ROW SECURITY; Schema: private; Owner: -
--

ALTER TABLE private.answer_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: private; Owner: -
--

ALTER TABLE private.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_actions action_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY action_read ON public.lab_actions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lab_sessions s
  WHERE ((s.id = lab_actions.session_id) AND (s.student_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: assignments assignment_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignment_read ON public.assignments FOR SELECT TO authenticated USING (((teacher_id = ( SELECT auth.uid() AS uid)) OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM public.assignment_recipients r
  WHERE ((r.assignment_version_id = assignments.published_version_id) AND (r.student_id = ( SELECT auth.uid() AS uid))))))));


--
-- Name: assignment_recipients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_recipients ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_targets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_targets ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_versions assignment_version_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignment_version_read ON public.assignment_versions FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_versions.assignment_id) AND (a.teacher_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.assignment_recipients r
  WHERE ((r.assignment_version_id = assignment_versions.id) AND (r.student_id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: assignment_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: experiments catalog_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY catalog_read ON public.experiments FOR SELECT TO authenticated, anon USING (published);


--
-- Name: experiment_versions catalog_version_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY catalog_version_read ON public.experiment_versions FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.experiments e
  WHERE ((e.id = experiment_versions.experiment_id) AND e.published))));


--
-- Name: class_members class_member_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY class_member_read ON public.class_members FOR SELECT TO authenticated USING ((student_id = ( SELECT auth.uid() AS uid)));


--
-- Name: class_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

--
-- Name: classes class_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY class_read ON public.classes FOR SELECT TO authenticated USING (((teacher_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.class_members m
  WHERE ((m.class_id = classes.id) AND (m.student_id = ( SELECT auth.uid() AS uid)) AND (m.left_at IS NULL))))));


--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: experiment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: experiment_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.experiment_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: experiments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

--
-- Name: invitations invitation_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY invitation_read ON public.invitations FOR SELECT TO authenticated USING ((created_by = ( SELECT auth.uid() AS uid)));


--
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: school_members membership_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY membership_read ON public.school_members FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: lab_notes note_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY note_read ON public.lab_notes FOR SELECT TO authenticated USING ((author_id = ( SELECT auth.uid() AS uid)));


--
-- Name: notifications notification_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_read ON public.notifications FOR SELECT TO authenticated USING ((recipient_id = ( SELECT auth.uid() AS uid)));


--
-- Name: notifications notification_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_update ON public.notifications FOR UPDATE TO authenticated USING ((recipient_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((recipient_id = ( SELECT auth.uid() AS uid)));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profile_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles profile_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_recipients recipient_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipient_read ON public.assignment_recipients FOR SELECT TO authenticated USING ((student_id = ( SELECT auth.uid() AS uid)));


--
-- Name: quiz_responses response_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY response_read ON public.quiz_responses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lab_sessions s
  WHERE ((s.id = quiz_responses.session_id) AND (s.student_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: experiment_results result_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY result_read ON public.experiment_results FOR SELECT TO authenticated USING ((student_id = ( SELECT auth.uid() AS uid)));


--
-- Name: school_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

--
-- Name: schools school_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY school_read ON public.schools FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.school_members m
  WHERE ((m.school_id = schools.id) AND (m.user_id = ( SELECT auth.uid() AS uid)) AND (m.status = 'active'::text)))));


--
-- Name: schools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_sessions session_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY session_read ON public.lab_sessions FOR SELECT TO authenticated USING ((student_id = ( SELECT auth.uid() AS uid)));


--
-- Name: assignment_targets target_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY target_read ON public.assignment_targets FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_targets.assignment_id) AND (a.teacher_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict 6gcMdEPGG6JQfBaKUXHhM4rWqXNX1DOoMdd90cjedOqucyMRkEnopCibCXLYzrK


-- Application trigger on Supabase Auth
CREATE TRIGGER create_labora_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.bootstrap_profile();


-- Application configuration in Supabase Storage
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy labora_avatar_read on storage.objects for select to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Upload/delete are performed by the verified backend, not by the browser SDK.
