export type User = {
  name: string;
  email: string;
  role: "student" | "teacher";
  className?: string;
};

export type Credentials = {
  mode: "login" | "register";
  profile: User;
  password: string;
};

export interface AuthGateway {
  readonly configured: boolean;
  authenticate(credentials: Credentials): Promise<User | null>;
}

export interface SessionRepository extends AuthGateway {
  localUser(): User | null;
  saveLocal(user: User | null): void;
  restore(): Promise<User | null>;
  signOut(): Promise<void>;
  updateProfile(user: User): Promise<void>;
}
