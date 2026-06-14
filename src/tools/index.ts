import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FeaturedeckClient } from "../services/featuredeck.js";
import type { AuthContext } from "../auth/context.js";
import { registerWhoamiTool } from "./whoami.js";
import { registerFeatureTools } from "./features.js";
import { registerRoadmapTools } from "./roadmap.js";

/**
 * Register every Featuredeck tool against an MCP server instance, scoped to a
 * single authenticated principal.
 *
 * Feature requests are end-user authored, so only read tools are exposed.
 * The roadmap is developer-owned, so it gets full CRUD — its write tools
 * self-gate on the resolved role.
 */
export function registerTools(
  server: McpServer,
  client: FeaturedeckClient,
  ctx: AuthContext
): void {
  registerWhoamiTool(server, ctx);
  registerRoadmapTools(server, client, ctx);
  registerFeatureTools(server, client);
}
