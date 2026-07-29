import { searchSourceBatch, type SearchListingsParams } from "./_search.js";
import type { Listing, SourceName } from "./_types.js";

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function batchNumber(value: unknown, fallback: number, maximum: number): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? Math.min(number, maximum) : fallback;
}

function parseParams(value: unknown): SearchListingsParams {
  if (!value || typeof value !== "object") throw new Error("Expected a JSON object");
  const body = value as Record<string, unknown>;
  if (typeof body.city !== "string" || !body.city.trim()) throw new Error("City is required");
  if (body.operation !== "rent" && body.operation !== "sale") throw new Error("Operation must be rent or sale");
  return {
    city: body.city.trim(),
    operation: body.operation,
    minPrice: numberValue(body.minPrice), maxPrice: numberValue(body.maxPrice),
    minArea: numberValue(body.minArea), maxArea: numberValue(body.maxArea),
  };
}

function normalized(listing: Listing): Listing {
  const { description: _description, ...lightweightListing } = listing;
  return {
    ...lightweightListing,
    pricePerM2: listing.pricePerM2 ?? (listing.price && listing.area ? listing.price / listing.area : undefined),
  };
}

/** Web-standard Vercel handler shared by the three physical source functions. */
export async function handleSourceSearch(source: SourceName, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await searchSourceBatch(
      source,
      parseParams(body),
      batchNumber(body.sourcePage, 1, 10_000),
      batchNumber(body.sourcePageSize, 3, 5),
    );
    return json({ ...result, listings: result.listings.map(normalized) });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 400);
  }
}
