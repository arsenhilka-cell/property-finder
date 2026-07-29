import type { CityConfig } from "./_cities.js";

export interface SearchParams {
  city: CityConfig;
  operation: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  page?: number;
  signal?: AbortSignal;
  requestTimeoutMs?: number;
}

export interface Listing {
  source: "olx" | "dimria" | "rieltor";
  sourceId?: string;
  title: string;
  price?: number;
  currency?: string;
  area?: number;
  pricePerM2?: number;
  city?: string;
  location?: string;
  imageUrl?: string;
  listingUrl: string;
  publishedAt?: string;
  description?: string;
  phone?: string;
}

export type SourceName = Listing["source"];

export interface HttpStatus {
  url: string;
  status: number;
  redirected: boolean;
  contentType: string | null;
  bytes: number;
  at: string;
}

export interface SourceAdapter {
  source: SourceName;
  buildSearchUrl(params: SearchParams): string;
  search(params: SearchParams): Promise<Listing[]>;
  searchPage?(params: SearchParams): Promise<{ listings: Listing[]; reportedTotal?: number }>;
  getDetail?(listing: Listing): Promise<Listing | undefined>;
}
