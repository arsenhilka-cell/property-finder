import { mkdir, writeFile } from "node:fs/promises";
import { olx } from "./sources/olx.js";
import { dimria } from "./sources/dimria.js";
import { rieltor } from "./sources/rieltor.js";
import type { SourceAdapter, SourceName } from "./types.js";
import { delay, statuses } from "./utils/http.js";

const adapters: Record<SourceName, SourceAdapter> = { olx, dimria, rieltor };
const requested = process.argv[2] || "all";

async function test(adapter: SourceAdapter) {
  statuses.length = 0;
  console.log(`\n=== ${adapter.source.toUpperCase()} ===`);
  console.log("Search URL:", adapter.buildSearchUrl({ city: "Одеса", operation: "rent" }));
  const pages = [];
  for (const page of [1, 2, 3]) { pages.push(await adapter.search({ city: "Одеса", operation: "rent", page })); await delay(900); }
  console.log("Listings by page:", pages.map(x => x.length).join(", "));
  console.log("First 3 page-1 listings:", JSON.stringify(pages[0].slice(0, 3), null, 2));
  console.log("Pages differ (URLs):", new Set(pages.map(x => x.slice(0, 10).map(y => y.listingUrl).join("|"))).size === 3);
  if (pages[0][0] && adapter.getDetail) {
    const detail = await adapter.getDetail(pages[0][0]); await delay(900);
    console.log("Detail probe:", JSON.stringify(detail, null, 2));
  }
  // One more, deliberately spaced, normal search request: total is five requests including a detail page when available.
  await adapter.search({ city: "Одеса", operation: "rent", page: 1 });
  console.log("HTTP statuses:", JSON.stringify(statuses, null, 2));
  await mkdir("debug", { recursive: true });
  await writeFile(`debug/${adapter.source}-statuses.json`, JSON.stringify(statuses, null, 2));
}

if (requested === "all") { for (const adapter of Object.values(adapters)) await test(adapter); }
else if (requested in adapters) await test(adapters[requested as SourceName]);
else throw new Error(`Unknown source: ${requested}`);
