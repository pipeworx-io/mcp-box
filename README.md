# mcp-box

Box (enterprise cloud storage) MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Box data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
