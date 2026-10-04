const subjects: readonly string[] = ["chemistry", "physics", "biology"];
const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/dashboard",
  "/laboratories",
  "/settings",
  "/kimia",
  "/fisika",
]);

export function resolveRouteContext(
  pathname: string,
  simulationIds: readonly string[],
) {
  const segments = pathname.split("/").filter(Boolean);
  const isSandbox =
    segments.length === 2 &&
    ((segments[0] === "sandbox" &&
      [...subjects, "free"].includes(segments[1])) ||
      (segments[0] === "laboratories" && subjects.includes(segments[1])));
  const physicsSimulationId =
    segments.length === 2 &&
    segments[0] === "fisika" &&
    simulationIds.includes(segments[1])
      ? segments[1]
      : null;
  const experimentId =
    segments[0] === "challenges" && segments[1] === "run"
      ? segments[2]
      : segments[1];
  return {
    segments,
    isSandbox,
    physicsSimulationId,
    experimentId: experimentId || "",
    isPublic: publicPaths.has(pathname) || isSandbox || !!physicsSimulationId,
  };
}
