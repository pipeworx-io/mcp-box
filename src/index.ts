interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Box (enterprise cloud storage) MCP Pack
 *
 * Requires OAuth connection — gateway injects credentials via _context.box.
 * The OAuth provider is named "box", so creds arrive under _context.box.accessToken.
 * Tools: list folder contents, get file metadata, search, read text content, get user profile.
 * All operations are read-only GETs against the Box API v2.0.
 */


interface BoxContext {
  box?: { accessToken: string };
}

const API = 'https://api.box.com/2.0';

const CONTENT_CAP = 100_000;

/**
 * Fetch JSON from the Box API.
 * - Returns { error: 'connection_required' } when no OAuth token is present.
 * - Returns { error: <status>, message: <body text> } on non-2xx responses.
 * - Otherwise returns the parsed JSON body.
 */
async function bFetch(ctx: BoxContext, url: string, options: RequestInit = {}): Promise<unknown> {
  if (!ctx.box) {
    return { error: 'connection_required', message: 'Connect your Box account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.box.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

/** Like bFetch but returns raw text (Box 302-redirects /content to a download URL; fetch follows it). Does NOT JSON.parse. */
async function bFetchText(ctx: BoxContext, url: string): Promise<unknown> {
  if (!ctx.box) {
    return { error: 'connection_required', message: 'Connect your Box account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ctx.box.accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.text();
}

interface BoxItem {
  id?: string;
  type?: string;
  name?: string;
  size?: number;
  modified_at?: string;
}

function mapItem(e: BoxItem) {
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    size: e.size,
    modified_at: e.modified_at,
  };
}

const tools: McpToolExport['tools'] = [
  {
    name: 'box_list_folder',
    description:
      'List the files and subfolders inside a Box (enterprise cloud storage) folder. Pass a folder id, or omit it to list the root folder ("0"). Returns each item\'s id, type (file or folder), name, size in bytes, and last-modified time. Use to browse a user\'s Box documents and files.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        folder_id: { type: 'string', description: 'The Box folder id to list. Defaults to "0", the root folder.' },
        limit: { type: 'number', description: 'Maximum number of items to return (default 100, max 1000).' },
      },
      required: [],
    },
  },
  {
    name: 'box_get_file',
    description:
      'Get full metadata for a single Box (cloud storage) file by its file id. Returns id, name, size, description, created and modified times, parent folder name, shared link URL, and file extension. Use after listing or searching to inspect one document.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_id: { type: 'string', description: 'The Box file id of the file to inspect.' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'box_search',
    description:
      'Search a user\'s Box (cloud storage) account for files and folders matching a query string across names and content. Optionally restrict to only files or only folders. Returns matching items with id, type, name, size, and last-modified time. Use to find documents by keyword.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query matched against Box file and folder names and content.' },
        type: { type: 'string', enum: ['file', 'folder'], description: 'Optional filter: restrict results to "file" or "folder".' },
        limit: { type: 'number', description: 'Maximum number of results to return (default 30, max 200).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'box_get_file_text',
    description:
      'Download and return the text content of a Box (cloud storage) file by its file id. Best for plain-text, Markdown, CSV, and other text documents; binary formats (Office docs, PDFs, images) will return unreadable bytes. Content is capped at ~100,000 characters and flagged when truncated.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_id: { type: 'string', description: 'The Box file id of the file to read.' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'box_get_user',
    description:
      'Get the signed-in Box (cloud storage) user\'s profile: id, name, login email, total storage space (space_amount in bytes), and used storage (space_used in bytes). Use to identify the connected account or report storage usage.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as BoxContext;
  delete args._context;

  switch (name) {
    case 'box_list_folder': {
      const folderId = encodeURIComponent(((args.folder_id as string) ?? '0') || '0');
      const limit = Math.min(1000, Math.max(1, (args.limit as number) ?? 100));
      const url = `${API}/folders/${folderId}/items?limit=${limit}&fields=id,type,name,size,modified_at,description`;
      const result = await bFetch(context, url);
      if (result && typeof result === 'object' && 'error' in result) return result;
      const r = result as { total_count?: number; entries?: BoxItem[] };
      return {
        folder_id: decodeURIComponent(folderId),
        total_count: r.total_count,
        entries: (r.entries ?? []).map(mapItem),
      };
    }
    case 'box_get_file': {
      const fileId = encodeURIComponent(args.file_id as string);
      const url = `${API}/files/${fileId}?fields=id,name,size,description,created_at,modified_at,parent,shared_link,extension`;
      const result = await bFetch(context, url);
      if (result && typeof result === 'object' && 'error' in result) return result;
      const f = result as {
        id?: string;
        name?: string;
        size?: number;
        description?: string;
        created_at?: string;
        modified_at?: string;
        parent?: { name?: string };
        shared_link?: { url?: string };
        extension?: string;
      };
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        description: f.description,
        created_at: f.created_at,
        modified_at: f.modified_at,
        parent: f.parent?.name,
        shared_link: f.shared_link?.url,
        extension: f.extension,
      };
    }
    case 'box_search': {
      const query = encodeURIComponent(args.query as string);
      const limit = Math.min(200, Math.max(1, (args.limit as number) ?? 30));
      const type = args.type as string | undefined;
      let url = `${API}/search?query=${query}&limit=${limit}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      url += `&fields=id,type,name,size,modified_at`;
      const result = await bFetch(context, url);
      if (result && typeof result === 'object' && 'error' in result) return result;
      const r = result as { total_count?: number; entries?: BoxItem[] };
      return {
        total_count: r.total_count,
        entries: (r.entries ?? []).map(mapItem),
      };
    }
    case 'box_get_file_text': {
      const fileId = encodeURIComponent(args.file_id as string);
      const url = `${API}/files/${fileId}/content`;
      const result = await bFetchText(context, url);
      if (result && typeof result === 'object' && 'error' in result) return result;
      const text = result as string;
      return {
        file_id: args.file_id,
        text: text.slice(0, CONTENT_CAP),
        truncated: text.length > CONTENT_CAP,
      };
    }
    case 'box_get_user': {
      const url = `${API}/users/me?fields=id,name,login,space_amount,space_used`;
      const result = await bFetch(context, url);
      if (result && typeof result === 'object' && 'error' in result) return result;
      const u = result as {
        id?: string;
        name?: string;
        login?: string;
        space_amount?: number;
        space_used?: number;
      };
      return {
        id: u.id,
        name: u.name,
        login: u.login,
        space_amount: u.space_amount,
        space_used: u.space_used,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 }, provider: 'box' } satisfies McpToolExport;
