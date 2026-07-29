import { dimria } from "./_dimria.js";
import { olx } from "./_olx.js";
import { rieltor } from "./_rieltor.js";
import type { Listing, SourceAdapter, SourceName } from "./_types.js";
import type { CityConfig } from "./_cities.js";
import { matchesRequestedCity } from "./_cities.js";
import { delay } from "./_http.js";

export interface SearchListingsParams {
  city: CityConfig;
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
const BATCH_MAX_PAGES = 5;
const BATCH_TIMEOUT_MS = 45_000;
const PAGE_TIMEOUT_MS = 8_000;

export interface SourceBatchResult {
  ok: true;
  source: SourceName;
  listings: Listing[];
  fetchedPages: number[];
  nextPage: number;
  hasMore: boolean;
  reportedTotal?: number;
  warnings: string[];
  diagnostics: { rawCards: number; parsedCards: number; rejectedByCity: number; rejectedByArea: number; rejectedByPrice: number; duplicates: number; finalListings: number };
}

export function getSourceAdapter(source: SourceName): SourceAdapter {
  const adapter = adapters.find(item => item.source === source);
  if (!adapter) throw new Error(`Unsupported source: ${source}`);
  return adapter;
}

/**
 * Provider URL filters are not uniformly reliable. Keep a listing with a missing
 * value, but never return one whose parsed area or price is known to be outside
 * the requested range.
 */
export function matchesKnownFilters(listing: Listing, params: SearchListingsParams): boolean {
  if (listing.area !== undefined) {
    if (params.minArea !== undefined && listing.area < params.minArea) return false;
    if (params.maxArea !== undefined && listing.area > params.maxArea) return false;
  }
  if (listing.price !== undefined) {
    if (params.minPrice !== undefined && listing.price < params.minPrice) return false;
    if (params.maxPrice !== undefined && listing.price > params.maxPrice) return false;
  }
  return true;
}

function rejectionReason(listing: Listing, params: SearchListingsParams): "area" | "price" | undefined {
  if (listing.area !== undefined && ((params.minArea !== undefined && listing.area < params.minArea) || (params.maxArea !== undefined && listing.area > params.maxArea))) return "area";
  if (listing.price !== undefined && ((params.minPrice !== undefined && listing.price < params.minPrice) || (params.maxPrice !== undefined && listing.price > params.maxPrice))) return "price";
  return undefined;
}

export async function searchSourceBatch(source: SourceName, params: SearchListingsParams, sourcePage = 1, sourcePageSize = 3): Promise<SourceBatchResult> {
  const adapter = getSourceAdapter(source);
  const startPage = Math.max(1, Math.floor(sourcePage));
  const pageCount = Math.max(1, Math.min(BATCH_MAX_PAGES, Math.floor(sourcePageSize)));
  const controller = new AbortController();
  const deadline = Date.now() + BATCH_TIMEOUT_MS;
  const stopTimer = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
  const listings: Listing[] = [];
  const fetchedPages: number[] = [];
  const warnings: string[] = [];
  const diagnostics = { rawCards: 0, parsedCards: 0, rejectedByCity: 0, rejectedByArea: 0, rejectedByPrice: 0, duplicates: 0, finalListings: 0 };
  let nextPage = startPage;
  let hasMore = true;
  let reportedTotal: number | undefined;
  let priorSignature: string | undefined;
  const seen = new Set<string>();
  try {
    for (let index = 0; index < pageCount; index++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) { warnings.push("Внутренний лимит времени поиска исчерпан"); break; }
      const page = startPage + index;
      try {
        const result = adapter.searchPage
          ? await adapter.searchPage({ ...params, page, signal: controller.signal, requestTimeoutMs: Math.min(PAGE_TIMEOUT_MS, remaining) })
          : { listings: await adapter.search({ ...params, page, signal: controller.signal, requestTimeoutMs: Math.min(PAGE_TIMEOUT_MS, remaining) }) };
        if (result.reportedTotal !== undefined) reportedTotal = result.reportedTotal;
        diagnostics.rawCards += result.diagnostics?.rawCards ?? result.listings.length;
        diagnostics.parsedCards += result.diagnostics?.parsedCards ?? result.listings.length;
        // Check the unfiltered page for pagination. A page may legitimately have
        // zero matches after local validation while a later page still has some.
        const signature = result.listings.map(dedupeKey).sort().join("|");
        if (!result.listings.length || signature === priorSignature) { hasMore = false; break; }
        priorSignature = signature;
        const cityResults = result.listings.map(listing => ({ listing, city: matchesRequestedCity(listing, params.city, source) }));
        const explicitlyRequested = cityResults.filter(item => item.city === true).length;
        const explicitlyOther = cityResults.filter(item => item.city === false).length;
        if (explicitlyOther > 0 && explicitlyOther >= Math.max(2, explicitlyRequested)) {
          diagnostics.rejectedByCity += result.listings.length;
          warnings.push(`${source.toUpperCase()} вернул объявления другого города`);
          hasMore = false;
          break;
        }
        const pageVerified = explicitlyRequested >= Math.min(3, result.listings.length);
        for (const { listing, city } of cityResults) {
          if (city === false || (city === "unknown" && !pageVerified)) { diagnostics.rejectedByCity++; continue; }
          const key = dedupeKey(listing);
          if (seen.has(key)) { diagnostics.duplicates++; continue; }
          seen.add(key);
          const reason = rejectionReason(listing, params);
          if (reason === "area") { diagnostics.rejectedByArea++; continue; }
          if (reason === "price") { diagnostics.rejectedByPrice++; continue; }
          listings.push(listing);
        }
        fetchedPages.push(page);
        nextPage = page + 1;
        if (index < pageCount - 1) await delay(400);
      } catch (error) {
        warnings.push(`Страница ${page}: ${error instanceof Error ? error.message : String(error)}`);
        break;
      }
    }
  } finally { clearTimeout(stopTimer); }
  diagnostics.finalListings = listings.length;
  return { ok: true, source, listings, fetchedPages, nextPage, hasMore, reportedTotal, warnings, diagnostics };
}

function dedupeKey(listing: Listing): string {
  return listing.sourceId ? `id:${listing.sourceId}` : `url:${listing.listingUrl}`;
}

interface CrawlResult { listings: Listing[]; error?: string; }

async function crawlSource(adapter: SourceAdapter, params: SearchListingsParams): Promise<CrawlResult> {
  const unique = new Map<string, Listing>();
  let priorPageSignature: string | undefined;

  for (let page = 1; page <= MAX_PAGES_SAFETY_LIMIT; page++) {
    const sourceParams = { ...params, page };
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
      if (matchesKnownFilters(listing, params)) unique.set(dedupeKey(listing), listing);
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
