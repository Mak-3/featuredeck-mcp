export type Role = "admin" | "editor" | "viewer";

export interface AuthContext {
  workspaceId: string;
  workspaceName?: string;
  projectId: string;
  projectName?: string;
  scopes: string[];
  role: Role;
  apiKey: string;
}

export function hasScope(ctx: AuthContext, scope: string): boolean {
  return ctx.scopes.includes(scope) || ctx.scopes.includes("*");
}

export function canWrite(ctx: AuthContext): boolean {
  return ctx.role === "admin" || ctx.role === "editor" || hasScope(ctx, "write");
}
