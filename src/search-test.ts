import { searchListings } from "./search-listings.ts";

const params = { city: "Одесса", operation: "rent" as const, minArea: 30, maxArea: 100, maxPrice: 60_000 };
console.log("Search params:", params);
const result = await searchListings(params);

console.log("OLX:", result.bySource.olx.length);
console.log("DIM.RIA:", result.bySource.dimria.length);
console.log("RIELTOR:", result.bySource.rieltor.length);
console.log("Total:", result.listings.length);
console.log("First 5 normalized listings:", JSON.stringify(result.listings.slice(0, 5), null, 2));
if (Object.keys(result.errors).length) console.log("Source errors:", JSON.stringify(result.errors, null, 2));
