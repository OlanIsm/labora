import { supabase } from "./supabase";

export function canSync(user: { email: string } | null): boolean {
  return !!supabase && !!user && !user.email.startsWith("demo-");
}
