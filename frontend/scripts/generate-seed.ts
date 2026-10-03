import { writeFileSync } from "node:fs";
import { experiments } from "../../backend/modules/catalog/definitions";
const sql = (value: unknown) =>
  `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
let seed =
  "-- Generated version 1 catalog. Keys remain in private schema. Run as database owner.\nbegin;\n";
for (const exp of experiments) {
  const definition = {
    ...exp,
    steps: exp.steps.map((s) => ({
      ...s,
      ...(s.question
        ? {
            question: {
              prompt: s.question.prompt,
              options: s.question.options,
              phase: s.question.phase,
            },
          }
        : {}),
    })),
  };
  seed += `insert into public.experiments(id,subject,title,summary,duration_minutes) values(${literal(exp.id)},${literal(exp.subject)},${literal(exp.title)},${literal(exp.subtitle)},${exp.duration}) on conflict(id) do nothing;\n`;
  seed += `insert into public.experiment_versions(experiment_id,version,definition) values(${literal(exp.id)},1,${sql(definition)}) on conflict(experiment_id,version) do nothing;\n`;
  seed += `update public.experiments set current_version_id=(select id from public.experiment_versions where experiment_id=${literal(exp.id)} and version=1) where id=${literal(exp.id)} and current_version_id is null;\n`;
  exp.steps.forEach((s, i) => {
    if (s.question)
      seed += `insert into private.answer_keys(experiment_version_id,question_key,correct_answer,explanation) select id,'${i}',${sql(s.question.answer)},${literal(s.question.explanation || "")} from public.experiment_versions where experiment_id=${literal(exp.id)} and version=1 on conflict(experiment_version_id,question_key) do nothing;\n`;
  });
}
writeFileSync("../backend/supabase/seed.sql", seed + "commit;\n");
