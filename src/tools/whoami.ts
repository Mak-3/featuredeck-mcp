import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthContext } from "../auth/context.js";
import { jsonResult, safeHandler } from "./helpers.js";


export function registerWhoamiTool(server: McpServer, ctx: AuthContext): void {
  server.registerTool(
    "featuredeck_whoami",
    {
      title: "Who am I",
      description:
        "Return the Featuredeck workspace, project, role and scopes that the current API key is authorised for.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safeHandler(async () =>
      jsonResult({
        workspaceId: ctx.workspaceId,
        projectId: ctx.projectId,
        role: ctx.role,
        scopes: ctx.scopes,
      })
    )
  );
}
