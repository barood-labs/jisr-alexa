// Prayer times computed locally (no API, no key), standard astronomical method
// (same math as praytimes.org). Default method ISNA (Fajr 15°, Isha 15°), Asr Shafi'i (shadow factor 1).
const METHODS = { ISNA: [15, 15], MWL: [18, 17], Egypt: [19.5, 17.5], Makkah: [18.5, null], Karachi: [18, 18] };
const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

function sun(jd) {
  const D = jd - 2451545.0, g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)), 360), e = 23.439 - 0.00000036 * D;
  const RA = fix(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15, 24);
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - RA };
}
function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }

/** Returns prayer times (local clock, "HH:MM") for a date, lat/lon and UTC offset in hours. */
export function prayerTimes({ lat, lon, tz, date = new Date(), method = 'ISNA' }) {
  const [fa, ia] = METHODS[method] || METHODS.ISNA;
  const jd = julian(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) - lon / (15 * 24);
  const mid = (t) => fix(12 - sun(jd + t / 24).eqt, 24);
  const angle = (a, t, ccw) => { const s = sun(jd + t / 24), z = mid(t); const v = (1 / 15) * deg(Math.acos((-Math.sin(rad(a)) - Math.sin(rad(s.decl)) * Math.sin(rad(lat))) / (Math.cos(rad(s.decl)) * Math.cos(rad(lat))))); return z + (ccw ? -v : v); };
  const asr = (t) => { const s = sun(jd + t / 24); const a = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - s.decl)))))); return angle(a, t, false); };
  const raw = { fajr: angle(fa, 5, true), sunrise: angle(0.833, 6, true), dhuhr: mid(12), asr: asr(13), maghrib: angle(0.833, 18, false), isha: ia == null ? angle(0.833, 18, false) + 1.5 : angle(ia, 18, false) };
  const out = {};
  for (const [k, v] of Object.entries(raw)) { const h = fix(v + tz - lon / 15 + (k === 'dhuhr' ? 1 / 60 : 0), 24); const m = Math.round(h * 60) % 1440; out[k] = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  return out;
}
