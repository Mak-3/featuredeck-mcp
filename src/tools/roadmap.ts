import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FeaturedeckClient } from "../services/featuredeck.js";
import { type AuthContext, canWrite } from "../auth/context.js";
import { jsonResult, errorResult, safeHandler } from "./helpers.js";

const ROADMAP_STATUSES = ["planned", "in_progress", "shipped"] as const;

export function registerRoadmapTools(
  server: McpServer,
  client: FeaturedeckClient,
  ctx: AuthContext
): void {
  server.registerTool(
    "featuredeck_list_roadmap",
    {
      title: "List roadmap",
      description:
        "List the roadmap items (planned / in-progress / shipped) for the current project.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safeHandler(async () => {
      const data = await client.request("/api/roadmap");
      return jsonResult(data);
    })
  );

  server.registerTool(
    "featuredeck_get_roadmap_item",
    {
      title: "Get roadmap item",
      description: "Fetch a single roadmap item by id.",
      inputSchema: {
        id: z.string().describe("The roadmap item id."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safeHandler(async (args) => {
      const data = await client.request(
        `/api/roadmap/${encodeURIComponent(args.id)}`
      );
      return jsonResult(data);
    })
  );

  if (!canWrite(ctx)) return;

  server.registerTool(
    "featuredeck_create_roadmap_item",
    {
      title: "Create roadmap item",
      description: "Create a new roadmap item for the current project.",
      inputSchema: {
        title: z.string().min(1).describe("Roadmap item title."),
        description: z.string().optional().describe("Optional longer description."),
        status: z
          .enum(ROADMAP_STATUSES)
          .optional()
          .describe("Roadmap status (default 'planned')."),
        featureRequestId: z
          .string()
          .optional()
          .describe("Optional id of a feature request this roadmap item is linked to."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    safeHandler(async (args) => {
      const data = await client.request("/api/roadmap", {
        method: "POST",
        body: {
          title: args.title,
          description: args.description,
          status: args.status,
          featureRequestId: args.featureRequestId,
        },
      });
      return jsonResult(data);
    })
  );

  server.registerTool(
    "featuredeck_update_roadmap_item",
    {
      title: "Update roadmap item",
      description:
        "Update the title, description and/or status of an existing roadmap item.",
      inputSchema: {
        id: z.string().describe("The roadmap item id."),
        title: z.string().optional().describe("New title."),
        description: z.string().optional().describe("New description."),
        status: z.enum(ROADMAP_STATUSES).optional().describe("New status."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    safeHandler(async (args) => {
      if (
        !args.title &&
        args.description === undefined &&
        args.status === undefined
      ) {
        return errorResult(
          "Provide at least one of `title`, `description` or `status`."
        );
      }
      const data = await client.request(
        `/api/roadmap/${encodeURIComponent(args.id)}`,
        {
          method: "PUT",
          body: {
            title: args.title,
            description: args.description,
            status: args.status,
          },
        }
      );
      return jsonResult(data);
    })
  );

  server.registerTool(
    "featuredeck_delete_roadmap_item",
    {
      title: "Delete roadmap item",
      description: "Permanently delete a roadmap item by id.",
      inputSchema: {
        id: z.string().describe("The roadmap item id."),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    },
    safeHandler(async (args) => {
      const data = await client.request(
        `/api/roadmap/${encodeURIComponent(args.id)}`,
        { method: "DELETE" }
      );
      return jsonResult(data ?? { success: true, id: args.id });
    })
  );
}
