import "server-only";
import { apiHandler, readJson } from "./shared/http";
import { AppError } from "./shared/errors";
import { fields, text, integer } from "./shared/validation";
import * as catalog from "./modules/catalog";
import * as classrooms from "./modules/classrooms";
import * as sessions from "./modules/sessions";
import * as assessment from "./modules/assessment";
import * as assignments from "./modules/assignments";
import * as notifications from "./modules/notifications";
import * as notes from "./modules/notes";
import { authConfiguration, serverSupabase } from "./shared/supabase";
import { recover, changePassword } from "./modules/identity/recovery";
import { uploadAvatar } from "./modules/identity/avatar";
import { throttle, requestOriginKey } from "./shared/rateLimit";
type Route = {
  pattern: RegExp;
  handlers: Partial<
    Record<string, (r: Request, m: RegExpMatchArray) => Promise<unknown>>
  >;
};
const routes: Route[] = [
  { pattern: /^me\/avatar$/, handlers: { POST: uploadAvatar } },
  { pattern: /^experiments$/, handlers: { GET: catalog.listExperiments } },
  {
    pattern: /^experiments\/([^/]+)$/,
    handlers: { GET: (_r, m) => catalog.experimentVersion(m[1]) },
  },
  {
    pattern: /^experiments\/([^/]+)\/authoring$/,
    handlers: { GET: (_r, m) => catalog.authoringDefinition(m[1]) },
  },
  {
    pattern: /^practice\/answers$/,
    handlers: {
      POST: async (r) => {
        const body = await readJson(r);
        fields(body, ["experimentId", "step", "choice"]);
        const exp = catalog.practiceDefinition(
          text(body.experimentId, "experimentId", 80),
        );
        const step = integer(body.step, "step", 0, exp.steps.length - 1),
          q = exp.steps[step].question;
        if (!q) throw new AppError("VALIDATION_ERROR");
        const choice = integer(body.choice, "choice", 0, q.options.length - 1);
        return {
          choice,
          correct: choice === q.answer,
          attempts: 1,
          prompt: q.prompt,
          explanation: q.explanation,
          expected: q.options[q.answer!],
        };
      },
    },
  },
  { pattern: /^memberships$/, handlers: { GET: classrooms.memberships } },
  { pattern: /^schools$/, handlers: { POST: classrooms.createSchool } },
  {
    pattern: /^classes$/,
    handlers: { GET: classrooms.classes, POST: classrooms.createClass },
  },
  {
    pattern: /^classes\/([^/]+)$/,
    handlers: { DELETE: (_r, m) => classrooms.archiveClass(m[1]) },
  },
  {
    pattern: /^classes\/([^/]+)\/members$/,
    handlers: { GET: (_r, m) => classrooms.classRoster(m[1]) },
  },
  {
    pattern: /^classes\/([^/]+)\/members\/([^/]+)$/,
    handlers: { DELETE: (_r, m) => classrooms.removeStudent(m[1], m[2]) },
  },
  { pattern: /^invitations$/, handlers: { POST: classrooms.createInvitation } },
  {
    pattern: /^invitations\/accept$/,
    handlers: { POST: classrooms.acceptInvitation },
  },
  {
    pattern: /^invitations\/([^/]+)$/,
    handlers: { DELETE: (_r, m) => classrooms.revokeInvitation(m[1]) },
  },
  {
    pattern: /^sessions$/,
    handlers: { GET: sessions.listSessions, POST: sessions.createSession },
  },
  {
    pattern: /^sessions\/([^/]+)$/,
    handlers: {
      GET: (_r, m) => sessions.getSession(m[1]),
      DELETE: (_r, m) => sessions.abandonSession(m[1]),
    },
  },
  {
    pattern: /^sessions\/([^/]+)\/actions$/,
    handlers: { POST: (r, m) => sessions.sessionEvent(r, m[1], "action") },
  },
  {
    pattern: /^sessions\/([^/]+)\/answers$/,
    handlers: { POST: (r, m) => sessions.sessionEvent(r, m[1], "answer") },
  },
  {
    pattern: /^sessions\/([^/]+)\/state$/,
    handlers: { PATCH: (r, m) => sessions.sessionEvent(r, m[1], "state") },
  },
  {
    pattern: /^sessions\/([^/]+)\/submit$/,
    handlers: { POST: (r, m) => assessment.submit(r, m[1]) },
  },
  {
    pattern: /^sessions\/([^/]+)\/notes$/,
    handlers: {
      GET: (_r, m) => notes.notes(m[1]),
      POST: (r, m) => notes.saveNote(r, m[1]),
    },
  },
  {
    pattern: /^sessions\/([^/]+)\/notes\/([^/]+)$/,
    handlers: { PATCH: (r, m) => notes.saveNote(r, m[1], m[2]) },
  },
  { pattern: /^progress$/, handlers: { GET: assessment.progress } },
  {
    pattern: /^progress\/summary$/,
    handlers: { GET: assessment.progressSummary },
  },
  {
    pattern: /^results\/([^/]+)$/,
    handlers: { GET: (_r, m) => assessment.getResult(m[1]) },
  },
  {
    pattern: /^assignments$/,
    handlers: {
      GET: assignments.listAssignments,
      POST: assignments.createAssignment,
    },
  },
  {
    pattern: /^assignments\/([^/]+)$/,
    handlers: {
      GET: (_r, m) => assignments.getAssignment(m[1]),
      PATCH: (r, m) => assignments.updateAssignment(r, m[1]),
      DELETE: (_r, m) => assignments.archiveAssignment(m[1]),
    },
  },
  {
    pattern: /^assignments\/([^/]+)\/publish$/,
    handlers: { POST: (r, m) => assignments.publishAssignment(r, m[1]) },
  },
  {
    pattern: /^assignments\/([^/]+)\/results$/,
    handlers: { GET: (r, m) => assignments.report(r, m[1]) },
  },
  {
    pattern: /^notifications$/,
    handlers: {
      GET: notifications.notifications,
      PATCH: notifications.readNotifications,
    },
  },
  { pattern: /^auth\/recover$/, handlers: { POST: recover } },
  { pattern: /^auth\/password$/, handlers: { POST: changePassword } },
];
export const handleRequest = apiHandler(async (request: Request) => {
  const path = new URL(request.url).pathname.replace(/^\/api\/v1\//, "");
  // Verified JWT subjects isolate quotas for students sharing a school network.
  // Handlers still validate the live Auth user and database memberships.
  const claims = authConfiguration().configured
    ? (await (await serverSupabase()).auth.getClaims()).data?.claims
    : null;
  await throttle(
    claims?.sub
      ? `http-user:${claims.sub}`
      : `http:${requestOriginKey(request)}`,
    240,
  );
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      const handler = route.handlers[request.method];
      if (!handler) throw new AppError("METHOD_NOT_ALLOWED");
      return handler(request, match);
    }
  }
  throw new AppError("NOT_FOUND");
});
