import { FeaturedeckClient, FeaturedeckApiError } from "../services/featuredeck.js";
import type { AuthContext, Role } from "./context.js";

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

interface ContextResponse {
  success: boolean;
  data: {
    workspaceId: string;
    workspaceName?: string;
    projectId: string;
    projectName?: string;
    scopes: string[];
    role: Role;
  };
}

export function extractBearer(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function resolveAuthContext(
  apiUrl: string,
  apiKey: string | null
): Promise<AuthContext> {
  if (!apiKey) {
    throw new AuthError(
      "Missing Featuredeck API key. Provide it via the FEATUREDECK_API_KEY env var (stdio) or an `Authorization: Bearer fd_live_...` header (http)."
    );
  }

  const client = new FeaturedeckClient(apiUrl, apiKey);

  let res: ContextResponse;
  try {
    res = await client.request<ContextResponse>("/api/auth/context");
  } catch (err) {
    if (err instanceof FeaturedeckApiError) {
      throw new AuthError(
        err.status === 0
          ? err.message
          : `Featuredeck rejected the API key: ${err.message}`,
        err.status || 401
      );
    }
    throw err;
  }

  if (!res?.data?.projectId) {
    throw new AuthError("Featuredeck returned an invalid auth context.");
  }

  return {
    workspaceId: res.data.workspaceId,
    workspaceName: res.data.workspaceName,
    projectId: res.data.projectId,
    projectName: res.data.projectName,
    scopes: res.data.scopes ?? [],
    role: res.data.role,
    apiKey,
  };
}
