import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FeaturedeckClient } from "./services/featuredeck.js";
import type { AuthContext } from "./auth/context.js";
import { registerTools } from "./tools/index.js";

export const SERVER_NAME = "featuredeck-mcp";
export const SERVER_VERSION = "0.1.0";

export function createServer(apiUrl: string, ctx: AuthContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Tools for reading and managing a Featuredeck project's feature requests and roadmap. " +
        "All actions are scoped to the workspace/project of the authenticated API key.",
    }
  );

  const client = new FeaturedeckClient(apiUrl, ctx.apiKey);
  registerTools(server, client, ctx);

  return server;
}
