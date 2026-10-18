// Free, keyless open data: OpenStreetMap Nominatim (geocoding) + Overpass (places).
// Data © OpenStreetMap contributors, ODbL 1.0. A bundled OSM snapshot keeps the demo fast and offline-safe.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const UA = process.env.OSM_USER_AGENT || 'jisr-alexa/1.0 (+https://github.com/baroodstore1-ai/jisr-alexa)';
const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const OFFLINE = process.env.JISR_OFFLINE === '1';
const SNAP = JSON.parse(readFileSync(fileURLToPath(new URL('../data/snapshot.json', import.meta.url)), 'utf8'));
const cache = new Map();

// What each "need" means in OSM tags. Keys are what a newcomer asks for.
export const NEEDS = {
  food: { label: 'Middle Eastern food', q: 'nwr["amenity"~"restaurant|fast_food|cafe"]["cuisine"~"lebanese|middle_eastern|arab|syrian|palestinian|iraqi|yemeni|egyptian|turkish|persian|falafel|kebab|shawarma"]' },
  halal: { label: 'halal food', q: 'nwr["amenity"~"restaurant|fast_food"]["diet:halal"~"yes|only"]' },
  grocery: { label: 'halal or international grocery', q: 'nwr["shop"~"supermarket|convenience|butcher|deli"]["diet:halal"~"yes|only"]' },
  mosque: { label: 'mosque', q: 'nwr["amenity"="place_of_worship"]["religion"="muslim"]' },
  bakery: { label: 'bakery', q: 'nwr["shop"~"bakery|pastry"]' },
  coffee: { label: 'coffee shop', q: 'nwr["amenity"="cafe"]' },
  library: { label: 'public library (free English classes and internet)', q: 'nwr["amenity"="library"]' },
  clinic: { label: 'clinic or pharmacy', q: 'nwr["amenity"~"clinic|pharmacy|doctors"]' },
};

export function cityKey(s = '') { return s.toLowerCase().replace(/[^a-z]/g, ''); }

async function get(url, opts = {}, ms = 6000) {
  if (cache.has(url + (opts.body || ''))) return cache.get(url + (opts.body || ''));
  const res = await fetch(url, { ...opts, headers: { 'user-agent': UA, accept: 'application/json', ...(opts.headers || {}) }, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  const data = await res.json();
  cache.set(url + (opts.body || ''), data);
  return data;
}

export async function geocode(city) {
  const snap = SNAP.cities[cityKey(city)];
  if (snap) return { name: snap.name, lat: snap.lat, lon: snap.lon, source: 'snapshot' };
  if (OFFLINE) throw new Error(`I don't know ${city} offline yet.`);
  const d = await get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`);
  if (!d[0]) throw new Error(`I couldn't find a city called ${city}.`);
  return { name: d[0].display_name.split(',')[0], lat: +d[0].lat, lon: +d[0].lon, source: 'nominatim' };
}

function dist(a, b) {
  const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function slim(el, center) {
  const t = el.tags || {}; const lat = el.lat ?? el.center?.lat; const lon = el.lon ?? el.center?.lon;
  const addr = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  return {
    name: t.name, name_ar: t['name:ar'], cuisine: t.cuisine, address: addr || undefined,
    hours: t.opening_hours, phone: t.phone || t['contact:phone'], website: t.website || t['contact:website'],
    halal: /yes|only/.test(t['diet:halal'] || '') || undefined,
    km: lat != null ? +dist(center, { lat, lon }).toFixed(1) : undefined,
    osm: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

export async function findPlaces(city, need = 'food', take = 5) {
  const n = NEEDS[need] ? need : 'food';
  const c = await geocode(city);
  let els, source;
  const snap = SNAP.cities[cityKey(city)]?.places?.[n];
  if (!OFFLINE && !snap?.length) {
    try {
      const q = `[out:json][timeout:8];${NEEDS[n].q}["name"](around:20000,${c.lat},${c.lon});out center tags 40;`;
      els = (await get(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'content-type': 'application/x-www-form-urlencoded' } }, 9000)).elements;
      source = 'openstreetmap-live';
    } catch (e) { if (!snap) throw new Error(`Map data is busy right now (${e.message}). Try again in a minute.`); }
  }
  if (!els) { els = snap || []; source = 'openstreetmap-snapshot'; }
  const places = els.map((e) => slim(e, c)).filter((p, i, a) => p.name && a.findIndex((q) => q.name === p.name) === i).sort((a, b) => (a.km ?? 99) - (b.km ?? 99)).slice(0, take);
  return { city: c.name, need: n, label: NEEDS[n].label, source, attribution: 'Data © OpenStreetMap contributors (ODbL)', places, center: { lat: c.lat, lon: c.lon } };
}
