import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { supabase } from "@/shared/infrastructure/supabase";
import type { SessionRepository, User } from "../model";

export const sessionRepository: SessionRepository = {
  configured: !!supabase,
  localUser: () => browserStorage.read<User | null>("labora-user", null),
  saveLocal: (user) => browserStorage.write("labora-user", user),
  async restore() {
    const local = this.localUser();
    if (!supabase) return local;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return local;
    const metadata = data.user.user_metadata;
    const user: User = {
      name: metadata.name || data.user.email?.split("@")[0] || "Siswa",
      email: data.user.email || "",
      role: metadata.role === "teacher" ? "teacher" : "student",
      className: metadata.className || "",
    };
    this.saveLocal(user);
    return user;
  },
  async authenticate({ mode, profile, password }) {
    if (!supabase) return profile;
    const response =
      mode === "register"
        ? await supabase.auth.signUp({
            email: profile.email,
            password,
            options: { data: profile },
          })
        : await supabase.auth.signInWithPassword({
            email: profile.email,
            password,
          });
    if (response.error) throw response.error;
    if (mode === "register" && !response.data.session) return null;
    const metadata = response.data.user?.user_metadata || {};
    return {
      ...profile,
      name: metadata.name || profile.name,
      role:
        metadata.role === "teacher"
          ? "teacher"
          : metadata.role === "student"
            ? "student"
            : profile.role,
      className: metadata.className || profile.className,
    };
  },
  async signOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    this.saveLocal(null);
  },
  async updateProfile(user) {
    if (canSync(user) && supabase) {
      const { error } = await supabase.auth.updateUser({
        data: { name: user.name, className: user.className },
      });
      if (error) throw error;
    }
    this.saveLocal(user);
  },
};
