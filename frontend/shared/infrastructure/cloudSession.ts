import { isDemoUser } from "../identity";

export function canSync(
  user: { email: string; mode?: string; id?: string } | null,
): boolean {
  return !!user && user.mode === "account" && !!user.id && !isDemoUser(user);
}
