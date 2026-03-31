/**
 * India Fuel Price Scraper — GoodReturns.in
 *
 * Source: https://goodreturns.in/petrol-price.html
 *         https://goodreturns.in/diesel-price.html
 *
 * GoodReturns publishes live official Indian fuel prices in static HTML.
 * The site uses Cloudflare, which blocks Node.js TLS fingerprints but
 * allows curl. We spawn curl as a subprocess (available on all Linux/Mac)
 * and parse the HTML with cheerio.
 *
 * Cache: results are stored in memory for 24 h per IST calendar day.
 * Fallback: date-seeded engine (see fuel.ts) if scraping fails.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import * as cheerio from "cheerio";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ScrapedCityPrice {
  city: string;
  petrolPrice: number;
  dieselPrice: number;
  petrolChange: number;
  dieselChange: number;
}

// ---------------------------------------------------------------------------
// City name normalisation
// GoodReturns sometimes uses "New Delhi", "Bengaluru", etc.
// ---------------------------------------------------------------------------
const GR_NAME_MAP: Record<string, string> = {
  "New Delhi":             "Delhi",
  "Bengaluru":             "Bangalore",
  "Vishakhapatnam":        "Visakhapatnam",
  "Trivandrum":            "Kochi",
  "Thiruvananthapuram":    "Kochi",
};

function normaliseCity(raw: string): string {
  const t = raw.trim();
  return GR_NAME_MAP[t] ?? t;
}

// ---------------------------------------------------------------------------
// Fetch URL using curl (bypasses Node.js TLS-fingerprint blocking)
// ---------------------------------------------------------------------------
async function fetchWithCurl(url: string): Promise<string> {
  const { stdout } = await execFileAsync("curl", [
    "-sL",                         // silent + follow redirects
    "--max-time", "20",            // total timeout
    "--connect-timeout", "10",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-IN,en;q=0.9",
    "-H", "Referer: https://www.google.com/",
    url,
  ], { maxBuffer: 10 * 1024 * 1024 }); // 10 MB buffer
  return stdout;
}

// ---------------------------------------------------------------------------
// Parse one GoodReturns fuel page → Map<normalisedCity, {price, change}>
// Table selector: table.gd-fuel-table-list
// Row: <td><a title="City">...</a></td> <td>&#x20b9;XX.XX</td> <td><span>±X.XX</span></td>
// ---------------------------------------------------------------------------
function parseFuelPage(html: string): Map<string, { price: number; change: number }> {
  const $ = cheerio.load(html);
  const result = new Map<string, { price: number; change: number }>();

  $("table.gd-fuel-table-list tbody tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const cityRaw = cells.eq(0).find("a").attr("title") ?? cells.eq(0).text().trim();
    if (!cityRaw || cityRaw.toLowerCase() === "city" || cityRaw.toLowerCase() === "state") return;

    const priceText = cells.eq(1).text().replace(/[₹\s,]/g, "").trim();
    const price = parseFloat(priceText);
    if (isNaN(price) || price < 50 || price > 200) return;

    const changeText = cells.eq(2).text().replace(/[₹\s,]/g, "").trim();
    const change = parseFloat(changeText) || 0;

    result.set(normaliseCity(cityRaw), { price, change });
  });

  return result;
}

// ---------------------------------------------------------------------------
// 24-hour in-memory cache (keyed by IST date string)
// ---------------------------------------------------------------------------
interface CacheEntry {
  date: string;
  data: ScrapedCityPrice[];
  source: string;
}

let _cache: CacheEntry | null = null;

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Public: fetch live prices (cached per IST day)
// Returns null if both sources fail — caller falls back to seeded engine.
// ---------------------------------------------------------------------------
export async function fetchLivePrices(): Promise<ScrapedCityPrice[] | null> {
  const today = todayIST();
  if (_cache?.date === today) return _cache.data;

  try {
    const [petrolHtml, dieselHtml] = await Promise.all([
      fetchWithCurl("https://goodreturns.in/petrol-price.html"),
      fetchWithCurl("https://goodreturns.in/diesel-price.html"),
    ]);

    const petrolMap = parseFuelPage(petrolHtml);
    const dieselMap = parseFuelPage(dieselHtml);

    // Merge on city name — only keep cities where both petrol & diesel are found
    const cities = new Set([...petrolMap.keys()].filter((c) => dieselMap.has(c)));
    if (cities.size === 0) return null;

    const data: ScrapedCityPrice[] = [];
    for (const city of cities) {
      const p = petrolMap.get(city)!;
      const d = dieselMap.get(city)!;
      data.push({ city, petrolPrice: p.price, dieselPrice: d.price, petrolChange: p.change, dieselChange: d.change });
    }

    _cache = { date: today, data, source: "GoodReturns.in" };
    return data;
  } catch {
    return null;
  }
}

export function getCacheSource(): string {
  return _cache?.source ?? "none";
}
