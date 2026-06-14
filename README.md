# Featuredeck MCP Server

Connect Featuredeck to Claude, Cursor, ChatGPT, and other MCP-compatible clients.

The server proxies requests to the Featuredeck backend API using Featuredeck API keys. It never connects directly to Supabase.

## Architecture

```
MCP Client
    ↓
Featuredeck MCP
    ↓
Featuredeck Backend API
    ↓
Supabase
```

## Available Tools

### Read

* `featuredeck_whoami`
* `featuredeck_list_feature_requests`
* `featuredeck_get_feature_request`
* `featuredeck_list_roadmap`
* `featuredeck_get_roadmap_item`

### Write (editor/admin only)

* `featuredeck_create_roadmap_item`
* `featuredeck_update_roadmap_item`
* `featuredeck_delete_roadmap_item`

## Local Usage

Create a `.env` file:

```env
FEATUREDECK_API_URL=https://your-app.com
FEATUREDECK_API_KEY=fd_live_xxxxxxxxx
MCP_TRANSPORT=stdio
```

Install and run:

```bash
npm install
npm run build
npm start
```

## Hosted Usage

Set the following environment variables:

```env
FEATUREDECK_API_URL=https://your-app.com
MCP_TRANSPORT=http
```

Deploy to Railway and expose:

```
POST /mcp
GET  /healthz
```

Each client authenticates using its own Featuredeck API key:

```
Authorization: Bearer fd_live_xxxxxxxxx
```

## Cursor Example

```json
{
  "mcpServers": {
    "featuredeck": {
      "url": "https://mcp.featuredeck.in/mcp",
      "headers": {
        "Authorization": "Bearer fd_live_xxxxxxxxx"
      }
    }
  }
}
```

## Development Roadmap

* Phase 1: API key authentication and roadmap tools
* Phase 2: OAuth support and audit logs
* Phase 3: MCP resources and advanced AI workflows