export function isDemoUser(
  user: { mode?: string; id?: string; email: string } | null,
): boolean {
  // Recognize only the fixed legacy demo namespace during the storage migration.
  return (
    !!user &&
    (user.mode === "demo" ||
      (!user.id &&
        !user.mode &&
        /^demo-(student|teacher)@labora\.local$/.test(user.email)))
  );
}
