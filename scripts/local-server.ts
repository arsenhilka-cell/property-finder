import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handleApiRequest } from "../api/_app.js";

const publicDir = join(process.cwd(), "public");
const port = Number(process.env.PORT || 3000);
const contentTypes: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

function toWebRequest(request: IncomingMessage): Request {
  const host = request.headers.host || `localhost:${port}`;
  const method = request.method || "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : Readable.toWeb(request) as ReadableStream;
  return new Request(`http://${host}${request.url || "/"}`, { method, headers: request.headers as HeadersInit, body, duplex: "half" } as RequestInit & { duplex: "half" });
}

async function writeWebResponse(response: ServerResponse, result: Response): Promise<void> {
  const headers: Record<string, string> = {};
  result.headers.forEach((value, key) => { headers[key] = value; });
  response.writeHead(result.status, headers);
  response.end(Buffer.from(await result.arrayBuffer()));
}

async function serveStatic(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405); response.end(); return; }
    const pathname = request.url === "/" ? "/index.html" : request.url?.split("?")[0] || "/index.html";
    const filePath = normalize(join(publicDir, pathname));
    if (!filePath.startsWith(publicDir)) { response.writeHead(403); response.end(); return; }
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404); response.end();
  }
}

async function handleLocalRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.url?.startsWith("/api/")) { await writeWebResponse(response, await handleApiRequest(toWebRequest(request))); return; }
  await serveStatic(request, response);
}

createServer(handleLocalRequest).listen(port, () => console.log(`Commercial realty MVP: http://localhost:${port}`));
