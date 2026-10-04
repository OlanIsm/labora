import type { AccountProfile, AuthConfiguration } from "@contracts/api";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { apiFetch, ApiError } from "@/shared/infrastructure/api";
import { isDemoUser } from "@/shared/identity";
import type { SessionRepository, User } from "../model";

let configured: boolean | null = null;

export const sessionRepository: SessionRepository = {
  get configured() {
    return configured === true;
  },
  localUser() {
    const cached = browserStorage.read<User | null>("labora-user", null);
    return cached &&
      typeof cached.name === "string" &&
      typeof cached.email === "string" &&
      ["student", "teacher"].includes(cached.role) &&
      isDemoUser(cached)
      ? cached
      : null;
  },
  saveLocal: (user) => browserStorage.write("labora-user", user),
  async restore() {
    configured = null;
    const config = await apiFetch<AuthConfiguration>("/auth/config");
    configured = config.configured;
    if (configured) {
      try {
        return await apiFetch<AccountProfile>("/me");
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== "UNAUTHENTICATED")
          throw error;
      }
    }
    return this.localUser();
  },
  async authenticate({ mode, profile, password }) {
    if (configured === null)
      configured = (await apiFetch<AuthConfiguration>("/auth/config"))
        .configured;
    if (!configured) return { ...profile, mode: "demo" };
    if (mode === "register") {
      const response = await apiFetch<{
        confirmationRequired: boolean;
        user: AccountProfile | null;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: profile.email,
          password,
          name: profile.name,
        }),
      });
      return response.user;
    }
    return apiFetch<AccountProfile>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: profile.email, password }),
    });
  },
  async enterDemo(profile) {
    await apiFetch("/auth/logout", { method: "POST" });
    const demo: User = { ...profile, mode: "demo" };
    this.saveLocal(demo);
    return demo;
  },
  async signOut() {
    await apiFetch("/auth/logout", { method: "POST" });
    this.saveLocal(null);
  },
  async updateProfile(user) {
    if (isDemoUser(user)) {
      this.saveLocal(user);
      return;
    }
    await apiFetch<AccountProfile>("/me", {
      method: "PATCH",
      body: JSON.stringify({ name: user.name }),
    });
  },
};
