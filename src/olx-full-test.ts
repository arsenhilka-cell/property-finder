import { olx, parseOlxSearchHtml } from "./sources/olx.ts";
import { delay, fetchText, htmlText, statuses } from "./utils/http.ts";

const params = { city: "Одесса", operation: "rent" as const, minArea: 30, maxArea: 100, maxPrice: 60_000 };
const unique = new Map<string, string>();
let rawCards = 0;
let reportedTotal: number | undefined;
let lastPage: number | undefined;
let pagesFetched = 0;
const pages: Array<{ page: number; status: number; rawCards: number; parsed: number }> = [];

function paginationLastPage(html: string): number | undefined {
  const pageNumbers = [...html.matchAll(/[?&;]page=(\d+)/g)].map(match => Number(match[1]));
  return pageNumbers.length ? Math.max(...pageNumbers) : undefined;
}

function resultTotal(html: string): number | undefined {
  const text = htmlText(html);
  const match = /Ми знайшли\s+([\d\s]+)\s+оголошен/i.exec(text);
  return match ? Number(match[1].replace(/\s/g, "")) : undefined;
}

for (let page = 1; page <= 200; page++) {
  const html = await fetchText(olx.buildSearchUrl({ ...params, page }), `olx-full-p${page}`);
  const { listings, diagnostics } = parseOlxSearchHtml(html, { ...params, page });
  const status = statuses.at(-1)!;
  if (page === 1) {
    reportedTotal = resultTotal(html);
    lastPage = paginationLastPage(html);
  }
  if (diagnostics.rawCards === 0) break;
  rawCards += diagnostics.rawCards;
  pagesFetched++;
  pages.push({ page, status: status.status, rawCards: diagnostics.rawCards, parsed: listings.length });
  for (const listing of listings) unique.set(listing.sourceId || listing.listingUrl, listing.listingUrl);
  if (lastPage !== undefined && page >= lastPage) break;
  await delay(1_200);
}

const summary = {
  params,
  adapterUrl: olx.buildSearchUrl(params),
  reportedTotal,
  pagesDiscovered: lastPage ?? pagesFetched,
  pagesFetched,
  rawCardsDiscovered: rawCards,
  uniqueListingsParsed: unique.size,
  pages,
};
console.log(JSON.stringify(summary, null, 2));
