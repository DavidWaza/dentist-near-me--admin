import type { LoginInput } from "../domain/login";

export interface AuthServicePort {
  isConfigured(): boolean;
  /** Resolves false on bad credentials; never reveals which part failed. */
  signInWithPassword(input: LoginInput): Promise<boolean>;
}
