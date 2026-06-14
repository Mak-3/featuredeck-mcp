export type Role = "admin" | "editor" | "viewer";

export interface AuthContext {
  /** Organisation the key belongs to. */
  workspaceId: string;
  /** Project the key is scoped to. */
  projectId: string;
  /** Raw scopes attached to the key (e.g. ["read", "write"]). */
  scopes: string[];
  /** Coarse role derived from scopes. */
  role: Role;
  /** The raw bearer key, forwarded to the backend on every call. */
  apiKey: string;
}

export function hasScope(ctx: AuthContext, scope: string): boolean {
  return ctx.scopes.includes(scope) || ctx.scopes.includes("*");
}

export function canWrite(ctx: AuthContext): boolean {
  return ctx.role === "admin" || ctx.role === "editor" || hasScope(ctx, "write");
}
