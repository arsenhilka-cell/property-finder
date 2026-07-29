import { dimria } from "./sources/dimria.ts";
import { olx } from "./sources/olx.ts";
import { rieltor } from "./sources/rieltor.ts";
import type { Listing, SearchParams, SourceAdapter, SourceName } from "./types.ts";
import { delay } from "./utils/http.ts";

export interface SearchListingsParams {
  city: string;
  operation: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  sources?: SourceName[];
}

export interface SearchListingsResult {
  listings: Listing[];
  bySource: Record<SourceName, Listing[]>;
  errors: Partial<Record<SourceName, string>>;
}

const adapters: SourceAdapter[] = [olx, dimria, rieltor];
// Requests within a provider remain sequential; 400 ms keeps the MVP responsive
// while avoiding a burst of parallel page fetches.
const REQUEST_DELAY_MS = 400;
const MAX_PAGES_SAFETY_LIMIT = 200;

function dedupeKey(listing: Listing): string {
  return listing.sourceId ? `id:${listing.sourceId}` : `url:${listing.listingUrl}`;
}

function matchesFilters(listing: Listing, params: SearchListingsParams): boolean {
  if (params.minArea !== undefined && (listing.area === undefined || listing.area < params.minArea)) return false;
  if (params.maxArea !== undefined && (listing.area === undefined || listing.area > params.maxArea)) return false;
  // Sources can return USD/EUR alongside UAH. No exchange-rate policy is in this MVP,
  // so numeric price bounds mean the amount as displayed by that source.
  if (params.minPrice !== undefined && (listing.price === undefined || listing.price < params.minPrice)) return false;
  if (params.maxPrice !== undefined && (listing.price === undefined || listing.price > params.maxPrice)) return false;
  return true;
}

interface CrawlResult { listings: Listing[]; error?: string; }

async function crawlSource(adapter: SourceAdapter, params: SearchListingsParams): Promise<CrawlResult> {
  const unique = new Map<string, Listing>();
  let priorPageSignature: string | undefined;

  for (let page = 1; page <= MAX_PAGES_SAFETY_LIMIT; page++) {
    const sourceParams: SearchParams = { ...params, page };
    let pageListings: Listing[];
    try { pageListings = await adapter.search(sourceParams); }
    catch (error) {
      // A transient network timeout should not discard an otherwise healthy source.
      // Retry once, still serially and only after a backoff.
      try {
        await delay(2_000);
        pageListings = await adapter.search(sourceParams);
      } catch (retryError) {
        return { listings: [...unique.values()], error: retryError instanceof Error ? retryError.message : String(retryError) };
      }
    }
    const signature = pageListings.map(dedupeKey).sort().join("|");

    // Sites that accept an out-of-range page sometimes repeat their final page.
    if (pageListings.length === 0 || signature === priorPageSignature) break;
    priorPageSignature = signature;

    for (const listing of pageListings) {
      // OLX applies its verified URL filters server-side. Do not discard a valid
      // card merely because price or area was absent from the card markup.
      if (adapter.source === "olx" || matchesFilters(listing, params)) unique.set(dedupeKey(listing), listing);
    }
    await delay(REQUEST_DELAY_MS);
  }
  return { listings: [...unique.values()] };
}

/**
 * Each source is crawled sequentially with a delay. Sources run in a small, bounded
 * concurrency of three so one slow provider does not hold up all UI results.
 * A source failure is isolated so the remaining sources still return listings.
 */
export async function searchListings(params: SearchListingsParams): Promise<SearchListingsResult> {
  const bySource: Record<SourceName, Listing[]> = { olx: [], dimria: [], rieltor: [] };
  const errors: Partial<Record<SourceName, string>> = {};

  const enabledSources = params.sources?.length ? new Set(params.sources) : undefined;
  const activeAdapters = adapters.filter(adapter => !enabledSources || enabledSources.has(adapter.source));
  const sourceResults = await Promise.all(activeAdapters.map(async adapter => ({ adapter, result: await crawlSource(adapter, params) })));
  for (const { adapter, result: sourceResult } of sourceResults) {
    bySource[adapter.source] = sourceResult.listings;
    if (sourceResult.error) errors[adapter.source] = sourceResult.error;
  }

  return { listings: adapters.flatMap(adapter => bySource[adapter.source]), bySource, errors };
}
