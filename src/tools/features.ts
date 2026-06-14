import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FeaturedeckClient } from "../services/featuredeck.js";
import { jsonResult, safeHandler } from "./helpers.js";

export function registerFeatureTools(
  server: McpServer,
  client: FeaturedeckClient
): void {
  server.registerTool(
    "featuredeck_list_feature_requests",
    {
      title: "List feature requests",
      description:
        "List feature requests for the current project, with optional filtering, search, sorting and pagination.",
      inputSchema: {
        page: z.number().int().min(1).optional().describe("Page number (default 1)."),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Items per page (default 20, max 100)."),
        status: z
          .string()
          .optional()
          .describe("Comma-separated statuses to filter by, e.g. 'open,planned'."),
        priority: z
          .string()
          .optional()
          .describe("Comma-separated priorities, e.g. 'high,medium'."),
        search: z.string().optional().describe("Free-text search over title/description."),
        sortBy: z
          .enum(["trending", "newest", "oldest", "most_upvotes"])
          .optional()
          .describe("Sort order (default trending)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safeHandler(async (args) => {
      const data = await client.request("/api/features", {
        query: {
          page: args.page,
          pageSize: args.pageSize,
          status: args.status,
          priority: args.priority,
          search: args.search,
          sortBy: args.sortBy,
        },
      });
      return jsonResult(data);
    })
  );

  server.registerTool(
    "featuredeck_get_feature_request",
    {
      title: "Get feature request",
      description: "Fetch a single feature request by id, including vote count and author.",
      inputSchema: {
        id: z.string().describe("The feature request id."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safeHandler(async (args) => {
      const data = await client.request(
        `/api/features/${encodeURIComponent(args.id)}`
      );
      return jsonResult(data);
    })
  );
}
