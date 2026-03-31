/**
 * India Fuel Price Tracker — API Routes
 *
 * Data strategy (in priority order):
 *  1. Live scrape from GoodReturns.in (real daily prices, cached 24h per IST day)
 *  2. Date-seeded deterministic engine (fallback if scraping fails)
 *
 * Endpoints:
 *   GET /api/fuel/prices          — all cities, today's prices + change vs yesterday
 *   GET /api/fuel/trend/:city     — 30-day daily price history for one city
 *   GET /api/fuel/source          — which data source is active (live / seeded)
 */

import { Router, type IRouter } from "express";
import {
  GetFuelPricesResponse,
  GetCityTrendResponse,
  GetCityTrendParams,
} from "@workspace/api-zod";
import { fetchLivePrices } from "./fuel-scraper.js";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Reference city table (base prices + state info)
// Used by the seeded-fallback engine and the trend endpoint
// ---------------------------------------------------------------------------
const CITY_META: Record<string, { petrol: number; diesel: number; state: string }> = {
  Mumbai:        { petrol: 104.21, diesel: 92.15, state: "Maharashtra" },
  Delhi:         { petrol: 94.72,  diesel: 87.62, state: "Delhi" },
  Bangalore:     { petrol: 101.94, diesel: 87.89, state: "Karnataka" },
  Chennai:       { petrol: 100.85, diesel: 92.44, state: "Tamil Nadu" },
  Hyderabad:     { petrol: 107.41, diesel: 95.65, state: "Telangana" },
  Kolkata:       { petrol: 103.94, diesel: 90.76, state: "West Bengal" },
  Pune:          { petrol: 104.32, diesel: 90.22, state: "Maharashtra" },
  Ahmedabad:     { petrol: 95.38,  diesel: 89.64, state: "Gujarat" },
  Jaipur:        { petrol: 104.88, diesel: 90.36, state: "Rajasthan" },
  Lucknow:       { petrol: 94.91,  diesel: 87.82, state: "Uttar Pradesh" },
  Chandigarh:    { petrol: 95.04,  diesel: 82.78, state: "Punjab" },
  Bhopal:        { petrol: 107.23, diesel: 91.93, state: "Madhya Pradesh" },
  Patna:         { petrol: 107.27, diesel: 94.05, state: "Bihar" },
  Bhubaneswar:   { petrol: 103.19, diesel: 94.76, state: "Odisha" },
  Guwahati:      { petrol: 94.39,  diesel: 81.37, state: "Assam" },
  Kochi:         { petrol: 103.89, diesel: 91.97, state: "Kerala" },
  Nagpur:        { petrol: 105.40, diesel: 92.56, state: "Maharashtra" },
  Surat:         { petrol: 95.62,  diesel: 89.87, state: "Gujarat" },
  Visakhapatnam: { petrol: 108.82, diesel: 96.14, state: "Andhra Pradesh" },
  Indore:        { petrol: 107.15, diesel: 92.48, state: "Madhya Pradesh" },
  "New Delhi":   { petrol: 94.72,  diesel: 87.62, state: "Delhi" },
};

// Lookup state by city name (supports both "Delhi" and "New Delhi")
function getState(city: string): string {
  return CITY_META[city]?.state ?? CITY_META["Delhi"]?.state ?? "India";
}

// ---------------------------------------------------------------------------
// Date-seeded fallback engine
// Deterministic, stable within a day, different across days
// ---------------------------------------------------------------------------
const ANCHOR_DATE = "2026-03-30";

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function priceShiftForDate(city: string, dateStr: string, fuelType: "petrol" | "diesel"): number {
  const anchor = new Date(ANCHOR_DATE);
  const target = new Date(dateStr);
  const days = Math.round((target.getTime() - anchor.getTime()) / 86_400_000);
  if (days === 0) return 0;

  const direction = days > 0 ? 1 : -1;
  const steps = Math.abs(days);
  let shift = 0;

  for (let i = 1; i <= steps; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + direction * i);
    const dayKey = `${city}-${fuelType}-${d.toISOString().split("T")[0]}`;
    const rng = mulberry32(hashString(dayKey));
    if (rng() > 0.20) continue;
    const magnitude = rng() * 0.45 + 0.05;
    const sign = rng() > 0.35 ? 1 : -1;
    shift += direction * sign * magnitude;
  }

  return Math.round(shift * 100) / 100;
}

function seededPrice(city: string, dateStr: string): { petrol: number; diesel: number } {
  const base = CITY_META[city] ?? CITY_META["Delhi"]!;
  return {
    petrol: Math.round((base.petrol + priceShiftForDate(city, dateStr, "petrol")) * 100) / 100,
    diesel: Math.round((base.diesel + priceShiftForDate(city, dateStr, "diesel")) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

function daysAgo(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// GET /api/fuel/prices
// ---------------------------------------------------------------------------
router.get("/prices", async (_req, res) => {
  const today = todayIST();
  const updatedAt = `${today}T06:00:00+05:30`;

  // --- Try live scrape first ---
  const live = await fetchLivePrices();

  if (live && live.length > 0) {
    const prices = live.map((c) => ({
      city: c.city,
      state: getState(c.city),
      petrolPrice: c.petrolPrice,
      dieselPrice: c.dieselPrice,
      petrolChange: c.petrolChange,
      dieselChange: c.dieselChange,
      updatedAt,
    }));
    return res.json(GetFuelPricesResponse.parse(prices));
  }

  // --- Fallback: date-seeded engine ---
  const yesterday = daysAgo(today, 1);
  const prices = Object.keys(CITY_META)
    .filter((c) => c !== "New Delhi")
    .map((city) => {
      const t = seededPrice(city, today);
      const y = seededPrice(city, yesterday);
      return {
        city,
        state: CITY_META[city]!.state,
        petrolPrice: t.petrol,
        dieselPrice: t.diesel,
        petrolChange: Math.round((t.petrol - y.petrol) * 100) / 100,
        dieselChange: Math.round((t.diesel - y.diesel) * 100) / 100,
        updatedAt,
      };
    });

  return res.json(GetFuelPricesResponse.parse(prices));
});

// ---------------------------------------------------------------------------
// GET /api/fuel/trend/:city
// 30-day history: live today + seeded historical fill
// ---------------------------------------------------------------------------
router.get("/trend/:city", async (req, res) => {
  const { city } = GetCityTrendParams.parse(req.params);

  const normCity = city === "New Delhi" ? "Delhi" : city;
  if (!CITY_META[normCity] && !CITY_META[city]) {
    res.status(404).json({ error: `City "${city}" not found` });
    return;
  }

  const today = todayIST();
  const trend: Array<{ date: string; petrolPrice: number; dieselPrice: number }> = [];

  // Try to get today's live price for the last entry
  const live = await fetchLivePrices();
  const liveCity = live?.find((c) => c.city === city || c.city === normCity);

  for (let i = 29; i >= 1; i--) {
    const dateStr = daysAgo(today, i);
    const p = seededPrice(normCity, dateStr);
    trend.push({ date: dateStr, petrolPrice: p.petrol, dieselPrice: p.diesel });
  }

  // Today: use live if available, else seeded
  if (liveCity) {
    trend.push({ date: today, petrolPrice: liveCity.petrolPrice, dieselPrice: liveCity.dieselPrice });
  } else {
    const p = seededPrice(normCity, today);
    trend.push({ date: today, petrolPrice: p.petrol, dieselPrice: p.diesel });
  }

  return res.json(GetCityTrendResponse.parse(trend));
});

// ---------------------------------------------------------------------------
// GET /api/fuel/source
// Shows which data source is active right now
// ---------------------------------------------------------------------------
router.get("/source", async (_req, res) => {
  const live = await fetchLivePrices();
  res.json({
    source: live && live.length > 0 ? "live" : "seeded",
    description:
      live && live.length > 0
        ? "Live prices scraped from GoodReturns.in (updated daily)"
        : "Date-seeded deterministic engine (GoodReturns.in temporarily unavailable)",
    citiesAvailable: live ? live.length : Object.keys(CITY_META).length - 1,
    cachedFor: "24 hours (resets at midnight IST)",
  });
});

export default router;
