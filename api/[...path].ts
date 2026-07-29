import { handleNodeRequest } from "../src/server.ts";

// Vercel discovers TypeScript files in /api automatically. This catch-all
// preserves the existing /api/search, /api/telegram and /api/sheets routes.
export default handleNodeRequest;
