CREATE INDEX assignments_published_version_identity ON public.assignments USING btree (published_version_id, id);

CREATE INDEX experiments_current_version_identity ON public.experiments USING btree (current_version_id, id);

CREATE INDEX sessions_assignment_experiment ON public.lab_sessions USING btree (assignment_version_id, experiment_version_id);

CREATE INDEX sessions_assignment_student ON public.lab_sessions USING btree (assignment_version_id, student_id);
