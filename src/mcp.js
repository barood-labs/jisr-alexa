// MCP server, spec 2025-11-25, Streamable HTTP transport (POST /mcp, JSON responses), zero dependencies.
// Also usable over stdio (`npm run mcp:stdio`) for desktop MCP clients.
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { toolDefs, runTool } from './tools.js';

export const PROTOCOL = '2025-11-25';
const SUPPORTED = [PROTOCOL, '2025-06-18', '2025-03-26'];
export const sessions = new Map(); // id -> { created, protocol }

export async function handle(msg) {
  const { id, method, params } = msg || {};
  if (msg?.jsonrpc !== '2.0' || typeof method !== 'string') return id === undefined ? null : { id: id ?? null, error: { code: -32600, message: 'Invalid Request' } };
  if (method === 'initialize') {
    const v = SUPPORTED.includes(params?.protocolVersion) ? params.protocolVersion : PROTOCOL;
    return { id, result: { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'jisr', title: 'Jisr · جسر: feel at home in a new city', version: '2.0.0' }, instructions: 'Jisr helps Arabic-speaking newcomers settle in a US city. Reply in the user\'s language; read each tool result\'s `speech` field aloud.' } };
  }
  if (method === 'tools/list') return { id, result: { tools: toolDefs } };
  if (method === 'tools/call') {
    if (!toolDefs.some((t) => t.name === params?.name)) return { id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } };
    try {
      const out = await runTool(params.name, params.arguments);
      return { id, result: { content: [{ type: 'text', text: out.speech || JSON.stringify(out) }], structuredContent: out, isError: false } };
    } catch (e) { return { id, result: { isError: true, content: [{ type: 'text', text: e.message }] } }; }
  }
  if (method === 'ping') return { id, result: {} };
  if (id === undefined) return null; // notifications (e.g. notifications/initialized)
  return { id, error: { code: -32601, message: `Method not found: ${method}` } };
}

/** Streamable HTTP handler for /mcp. Returns true if it handled the request. */
export async function httpHandler(req, res, body) {
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  if (origin && allowed.length && !allowed.includes(origin) && origin !== `https://${req.headers.host}` && origin !== `http://${req.headers.host}`) return send(res, 403, { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Origin not allowed' } });
  if (req.method === 'GET') { res.writeHead(405, { allow: 'POST, DELETE' }); return res.end(); } // no server-initiated stream
  if (req.method === 'DELETE') { sessions.delete(req.headers['mcp-session-id']); res.writeHead(204); return res.end(); }
  if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST, DELETE' }); return res.end(); }
  let msg; try { msg = JSON.parse(body); } catch { return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  const sid = req.headers['mcp-session-id'];
  const isInit = !Array.isArray(msg) && msg?.method === 'initialize';
  if (!isInit && sid && !sessions.has(sid)) return send(res, 404, { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Session not found' } });
  const pv = req.headers['mcp-protocol-version'];
  if (!isInit && pv && !SUPPORTED.includes(pv)) return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32000, message: `Unsupported MCP-Protocol-Version ${pv}` } });
  const batch = Array.isArray(msg) ? msg : [msg];
  const out = (await Promise.all(batch.map(handle))).filter(Boolean).map((o) => ({ jsonrpc: '2.0', ...o }));
  const headers = {};
  if (isInit && out[0]?.result) { const nid = randomUUID(); sessions.set(nid, { created: Date.now(), protocol: out[0].result.protocolVersion }); headers['mcp-session-id'] = nid; }
  if (!out.length) { res.writeHead(202, headers); return res.end(); }
  return send(res, 200, Array.isArray(msg) ? out : out[0], headers);
}

function send(res, code, o, headers = {}) { res.writeHead(code, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(o)); }

if (process.argv[1] && process.argv[1].endsWith('mcp.js')) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', async (line) => {
    if (!line.trim()) return; let m; try { m = JSON.parse(line); } catch { return; }
    const o = await handle(m); if (o) process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...o }) + '\n');
  });
}
