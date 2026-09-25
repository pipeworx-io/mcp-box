# mcp-box

Box (enterprise cloud storage) MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `box_list_folder` | List the files and subfolders inside a Box (enterprise cloud storage) folder. Pass a folder id, or omit it to list the root folder ("0"). Returns each item's id, type (file or folder), name, size in bytes, and last-modified time. Use to browse a user's Box documents and files. |
| `box_get_file` | Get full metadata for a single Box (cloud storage) file by its file id. Returns id, name, size, description, created and modified times, parent folder name, shared link URL, and file extension. Use after listing or searching to inspect one document. |
| `box_search` | Search a user's Box (cloud storage) account for files and folders matching a query string across names and content. Optionally restrict to only files or only folders. Returns matching items with id, type, name, size, and last-modified time. Use to find documents by keyword. |
| `box_get_file_text` | Download and return the text content of a Box (cloud storage) file by its file id. Best for plain-text, Markdown, CSV, and other text documents; binary formats (Office docs, PDFs, images) will return unreadable bytes. Content is capped at ~100,000 characters and flagged when truncated. |
| `box_get_user` | Get the signed-in Box (cloud storage) user's profile: id, name, login email, total storage space (space_amount in bytes), and used storage (space_used in bytes). Use to identify the connected account or report storage usage. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "box": {
      "url": "https://gateway.pipeworx.io/box/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/box/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

This pack runs against a connected box account, so it needs a Pipeworx key: sign in at https://pipeworx.io/account, connect box, then call `POST https://gateway.pipeworx.io/v1/tools/box_list_folder` with `Authorization: Bearer <your Pipeworx key>`. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/box_list_folder`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "box": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-box"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-box
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Box data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
