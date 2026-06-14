#!/usr/bin/env node
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig, type ServerConfig } from "./config.js";
import { createServer } from "./server.js";
import { resolveAuthContext, extractBearer, AuthError } from "./auth/apiKey.js";

/** stdio is the transport used by Claude Desktop, Cursor and most local clients. */
async function runStdio(config: ServerConfig): Promise<void> {
  // Validate up front so misconfiguration fails fast with a clear message.
  const ctx = await resolveAuthContext(config.apiUrl, config.apiKey);
  console.error(
    `[featuredeck-mcp] authenticated as role=${ctx.role} workspace=${ctx.workspaceId} project=${ctx.projectId}`
  );

  const server = createServer(config.apiUrl, ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[featuredeck-mcp] stdio transport ready");
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/**
 * Streamable HTTP transport for hosted / multi-tenant use.
 *
 * The API key is validated once, on the `initialize` request
 * (`Authorization: Bearer fd_live_...`). A session is then created and bound to
 * that authenticated principal; follow-up requests reuse the session via the
 * `mcp-session-id` header. Sessions are torn down when the transport closes.
 */
async function runHttp(config: ServerConfig): Promise<void> {
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/healthz") {
      return sendJson(res, 200, { status: "ok" });
    }

    if (url.pathname !== "/mcp") {
      return sendJson(res, 404, {
        jsonrpc: "2.0",
        error: { code: -32601, message: "Not found" },
        id: null,
      });
    }

    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      // Reuse an existing session (any method: POST / GET SSE / DELETE).
      if (sessionId && sessions.has(sessionId)) {
        const transport = sessions.get(sessionId)!;
        return await transport.handleRequest(req, res);
      }

      // Only POST can establish a new session, and only via `initialize`.
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return sendJson(res, 405, {
          jsonrpc: "2.0",
          error: { code: -32600, message: "Method not allowed" },
          id: null,
        });
      }

      const body = await readBody(req);

      if (!isInitializeRequest(body)) {
        return sendJson(res, 400, {
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message:
              "Bad Request: no valid session. Send an `initialize` request first.",
          },
          id: null,
        });
      }

      // Authenticate the key exactly once, when the session is created.
      const apiKey = extractBearer(req.headers.authorization);
      const ctx = await resolveAuthContext(config.apiUrl, apiKey);

      const server = createServer(config.apiUrl, ctx);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      if (err instanceof AuthError) {
        res.setHeader("WWW-Authenticate", 'Bearer realm="featuredeck"');
        return sendJson(res, err.status || 401, {
          jsonrpc: "2.0",
          error: { code: -32001, message: err.message },
          id: null,
        });
      }
      return sendJson(res, 400, {
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: err instanceof Error ? err.message : "Bad request",
        },
        id: null,
      });
    }
  });

  httpServer.listen(config.port, config.host, () => {
    console.error(
      `[featuredeck-mcp] streamable HTTP transport listening on ${config.host}:${config.port} (POST /mcp)`
    );
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  if (config.transport === "http") {
    await runHttp(config);
  } else {
    await runStdio(config);
  }
}

main().catch((err) => {
  console.error(
    `[featuredeck-mcp] fatal: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
});
