/**
 * Centralised runtime configuration for the Featuredeck MCP server.
 *
 * All configuration comes from environment variables so the same binary works
 * for local stdio clients (Claude Desktop, Cursor) and a hosted HTTP deployment.
 */

export type TransportKind = "stdio" | "http";

export interface ServerConfig {
  /** Base URL of the Featuredeck backend API (no trailing slash). */
  apiUrl: string;
  /** API key used to authenticate in stdio mode. Empty in http mode. */
  apiKey: string;
  /** Which transport to run. */
  transport: TransportKind;
  /** Port for the HTTP transport. */
  port: number;
  /** Interface to bind the HTTP transport to. */
  host: string;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function loadConfig(argv: string[] = process.argv.slice(2)): ServerConfig {
  const forceHttp = argv.includes("--http");
  const forceStdio = argv.includes("--stdio");

  const envTransport = (process.env.MCP_TRANSPORT || "").toLowerCase();
  let transport: TransportKind = "stdio";
  if (forceHttp) transport = "http";
  else if (forceStdio) transport = "stdio";
  else if (envTransport === "http") transport = "http";

  const apiUrl = stripTrailingSlash(
    process.env.FEATUREDECK_API_URL || "http://localhost:3000"
  );

  return {
    apiUrl,
    apiKey: process.env.FEATUREDECK_API_KEY || "",
    transport,
    port: Number(process.env.PORT || 8787),
    // Bind all interfaces by default so it works inside containers (Railway,
    // Render, Fly, etc). Override with HOST if needed.
    host: process.env.HOST || "0.0.0.0",
  };
}
