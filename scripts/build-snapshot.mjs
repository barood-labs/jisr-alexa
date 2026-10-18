// Rebuilds data/snapshot.json from live OpenStreetMap (Overpass). Run: npm run snapshot
import { writeFileSync } from 'node:fs';
process.env.JISR_OFFLINE = '1';
const { NEEDS } = await import('../src/geo.js');
const CITIES = [
  ['saltlakecity', 'Salt Lake City', 40.7596, -111.8868, 'America/Denver'],
  ['houston', 'Houston', 29.7604, -95.3698, 'America/Chicago'],
  ['dearborn', 'Dearborn', 42.3223, -83.1763, 'America/Detroit'],
  ['seattle', 'Seattle', 47.6062, -122.3321, 'America/Los_Angeles'],
  ['newyork', 'New York', 40.7128, -74.006, 'America/New_York'],
];
const UA = 'jisr-alexa/1.0 (+https://github.com/baroodstore1-ai/jisr-alexa)';
const KEEP = /^(name|name:ar|cuisine|addr:housenumber|addr:street|opening_hours|phone|contact:phone|website|contact:website|diet:halal|amenity|shop|religion)$/;
const out = { attribution: 'Data © OpenStreetMap contributors, ODbL 1.0', built: new Date().toISOString(), cities: {} };

function classify(t) {
  const halal = /yes|only/.test(t['diet:halal'] || '');
  if (t.amenity === 'place_of_worship' && t.religion === 'muslim') return 'mosque';
  if (/supermarket|convenience|butcher|deli/.test(t.shop || '') && halal) return 'grocery';
  if (/restaurant|fast_food|cafe/.test(t.amenity || '') && /lebanese|middle_eastern|arab|syrian|palestinian|iraqi|yemeni|egyptian|turkish|persian|falafel|kebab|shawarma/.test(t.cuisine || '')) return 'food';
  if (/restaurant|fast_food/.test(t.amenity || '') && halal) return 'halal';
  if (/bakery|pastry/.test(t.shop || '')) return 'bakery';
  if (t.amenity === 'cafe') return 'coffee';
  if (t.amenity === 'library') return 'library';
  if (/clinic|pharmacy|doctors/.test(t.amenity || '')) return 'clinic';
  return null;
}

for (const [k, name, lat, lon, tz] of CITIES) {
  out.cities[k] = { name, lat, lon, tz, places: Object.fromEntries(Object.keys(NEEDS).map((n) => [n, []])) };
  // One query per city (Overpass is slow); 12 km radius keeps it small; sorted into needs locally.
  const qs = Object.entries(NEEDS).map(([n, { q }]) => `${q}["name"](around:12000,${lat},${lon})->.${n};.${n} out center tags 30;`).join('');
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(`[out:json][timeout:170];${qs}`), signal: AbortSignal.timeout(200000) });
      if (!r.ok) throw new Error(r.status);
      for (const { type, id, lat: la, lon: lo, center, tags = {} } of (await r.json()).elements) {
        const n = classify(tags); if (!n || out.cities[k].places[n].length >= 25) continue;
        out.cities[k].places[n].push({ type, id, lat: la, lon: lo, center, tags: Object.fromEntries(Object.entries(tags).filter(([t]) => KEEP.test(t))) });
      }
      console.log(name, Object.fromEntries(Object.entries(out.cities[k].places).map(([n, a]) => [n, a.length]))); break;
    } catch (e) { console.log('retry', name, e.message); await new Promise((s) => setTimeout(s, 10000)); }
  }
  writeFileSync(new URL('../data/snapshot.json', import.meta.url), JSON.stringify(out));
}
