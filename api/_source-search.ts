import { searchSourceBatch, type SearchListingsParams } from "./_search.js";
import type { Listing, SourceName } from "./_types.js";
import { getCity } from "./_cities.js";

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
  if (typeof body.cityId !== "string" || !body.cityId.trim()) throw new Error("City selection is required");
  const city = getCity(body.cityId);
  if (!city) throw new Error("Unknown cityId");
  if (body.operation !== "rent" && body.operation !== "sale") throw new Error("Operation must be rent or sale");
  return {
    city,
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
    const params = parseParams(body);
    const mapping = params.city[source];
    if (!mapping || mapping.slug === undefined) {
      return json({ ok: true, source, listings: [], fetchedPages: [], nextPage: batchNumber(body.sourcePage, 1, 10_000), hasMore: false, warnings: [`Для ${source.toUpperCase()} данный город пока не настроен.`], diagnostics: { rawCards: 0, parsedCards: 0, rejectedByCity: 0, rejectedByArea: 0, rejectedByPrice: 0, duplicates: 0, finalListings: 0 } });
    }
    const result = await searchSourceBatch(
      source,
      params,
      batchNumber(body.sourcePage, 1, 10_000),
      batchNumber(body.sourcePageSize, 3, 5),
    );
    return json({ ...result, listings: result.listings.map(normalized) });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected server error" }, 400);
  }
}
