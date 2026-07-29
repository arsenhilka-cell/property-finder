import { publicCities } from "./_cities.js";

export default {
  fetch(request: Request): Response {
    if (request.method !== "GET") return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
    return Response.json({ ok: true, cities: publicCities() });
  },
};
