import { handleApiRequest } from "../src/api.ts";

// Vercel discovers TypeScript files in /api automatically. The Fetch handler
// avoids local node:http server state in a serverless invocation.
export default { fetch: handleApiRequest };
