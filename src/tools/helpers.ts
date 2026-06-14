import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { FeaturedeckApiError } from "../services/featuredeck.js";

/** Render a successful tool result as pretty JSON text. */
export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/** Render an error tool result (sets isError so the client/model can react). */
export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Wrap a tool handler so backend/API errors become structured tool errors
 * instead of crashing the transport.
 */
export function safeHandler<A>(
  handler: (args: A) => Promise<CallToolResult>
): (args: A) => Promise<CallToolResult> {
  return async (args: A) => {
    try {
      return await handler(args);
    } catch (err) {
      if (err instanceof FeaturedeckApiError) {
        return errorResult(
          `Featuredeck API error (${err.status}): ${err.message}`
        );
      }
      return errorResult(
        err instanceof Error ? err.message : "Unexpected error"
      );
    }
  };
}
