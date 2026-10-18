// Jisr tools: one schema + one function each. The same set powers the MCP server and the Alexa+ simulator.
// Every result carries `speech` (EN or AR) so a voice assistant can read it aloud as-is.
import { findPlaces, geocode, NEEDS, cityKey } from './geo.js';
import { prayerTimes } from './prayer.js';
import { findPhrase, PHRASES } from './phrases.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const SNAP = JSON.parse(readFileSync(fileURLToPath(new URL('../data/snapshot.json', import.meta.url)), 'utf8'));

const lang = (l) => (l === 'ar' ? 'ar' : 'en');
const NEED_AR = { food: 'أكل شرق أوسطي', halal: 'أكل حلال', grocery: 'بقالة حلال', mosque: 'مسجد', bakery: 'مخبز', coffee: 'مقهى', library: 'مكتبة عامة', clinic: 'عيادة أو صيدلية' };
// Arabic city names for the snapshot cities; Latin names inside Arabic sentences are wrapped in Unicode
// isolates (FSI…PDI) so right-to-left screens keep the word order and punctuation intact.
const CITY_AR = { saltlakecity: 'سولت ليك سيتي', houston: 'هيوستن', dearborn: 'ديربورن', seattle: 'سياتل', newyork: 'نيويورك' };
const iso = (s) => (/[A-Za-z]/.test(s) ? `\u2068${s}\u2069` : s);
const cityAr = (name) => CITY_AR[cityKey(name)] || iso(name);
const PRAYER_AR = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

function tzOffset(tz, date) {
  try { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date).find((x) => x.type === 'timeZoneName').value; const m = p.match(/GMT([+-]\d+)(?::(\d+))?/); return m ? +m[1] + (m[2] ? Math.sign(+m[1]) * m[2] / 60 : 0) : 0; } catch { return null; }
}

export const toolDefs = [
  {
    name: 'find_places_like_home',
    title: 'Find places like home',
    description: 'Find real places near a city center that help an Arabic-speaking newcomer feel at home: Middle Eastern food, halal food, halal grocery, mosque, bakery, coffee, public library, clinic/pharmacy. Data from OpenStreetMap.',
    inputSchema: { type: 'object', properties: { city: { type: 'string', description: 'City name, e.g. "Salt Lake City"' }, need: { type: 'string', enum: Object.keys(NEEDS) }, lang: { type: 'string', enum: ['en', 'ar'] }, take: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['city'] },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: 'prayer_times',
    title: 'Prayer times',
    description: 'Today\'s five daily prayer times for a city, computed locally (ISNA method by default).',
    inputSchema: { type: 'object', properties: { city: { type: 'string' }, timezone: { type: 'string', description: 'IANA zone, e.g. America/Denver. Optional for known cities.' }, method: { type: 'string', enum: ['ISNA', 'MWL', 'Egypt', 'Makkah', 'Karachi'] }, lang: { type: 'string', enum: ['en', 'ar'] } }, required: ['city'] },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'say_it_in_english',
    title: 'Say it in English',
    description: 'Give a newcomer the exact English (and Arabic) sentence for a common situation: doctor, pharmacy, halal, bus, school, rent, emergency, English classes, job, thanks.',
    inputSchema: { type: 'object', properties: { topic: { type: 'string', description: 'Situation in English or Arabic, e.g. "my son is sick"' }, lang: { type: 'string', enum: ['en', 'ar'] } }, required: ['topic'] },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'first_week_plan',
    title: 'First week plan',
    description: 'A 7-day "feel at home" plan for a new city that combines food from home, a mosque, a grocery, a library and a coffee shop, each a real place.',
    inputSchema: { type: 'object', properties: { city: { type: 'string' }, lang: { type: 'string', enum: ['en', 'ar'] } }, required: ['city'] },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
];

export const tools = {
  async find_places_like_home({ city, need = 'food', lang: l, take = 3 }) {
    l = lang(l); const r = await findPlaces(city, need, Math.min(+take || 3, 10));
    const top = r.places;
    const speech = !top.length
      ? (l === 'ar' ? `لم أجد ${NEED_AR[r.need]} قرب ${cityAr(r.city)} في بيانات الخريطة.` : `I couldn't find a ${r.label} near ${r.city} in the map data.`)
      : l === 'ar'
        ? `أقرب ${NEED_AR[r.need]} في ${cityAr(r.city)}: ` + top.map((p) => `${p.name_ar || iso(p.name)}${p.km != null ? `، على بعد ${p.km} كم` : ''}`).join('؛ ') + '.'
        : `Closest ${r.label} in ${r.city}: ` + top.map((p) => `${p.name}${p.km != null ? `, ${p.km} kilometers away` : ''}${p.halal && r.need === 'food' ? ', marked halal' : ''}`).join('; ') + '.';
    return { ...r, speech };
  },

  async prayer_times({ city, timezone, method = 'ISNA', lang: l }) {
    l = lang(l); const c = await geocode(city); const now = new Date();
    const tz = timezone || SNAP.cities[cityKey(city)]?.tz;
    let off = tz ? tzOffset(tz, now) : null;
    if (off == null) off = Math.round(c.lon / 15);
    const t = prayerTimes({ lat: c.lat, lon: c.lon, tz: off, date: now, method });
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const speech = l === 'ar'
      ? `مواقيت الصلاة اليوم في ${cityAr(c.name)}: ` + order.map((k) => `${PRAYER_AR[k]} ${t[k]}`).join('، ') + '.'
      : `Prayer times today in ${c.name}: ` + order.map((k) => `${k[0].toUpperCase() + k.slice(1)} ${t[k]}`).join(', ') + '.';
    return { city: c.name, timezone: tz || `UTC${off >= 0 ? '+' : ''}${off} (estimated)`, method, times: t, speech };
  },

  async say_it_in_english({ topic, lang: l }) {
    l = lang(l); const p = findPhrase(topic);
    if (!p) return { topics: Object.keys(PHRASES), speech: l === 'ar' ? 'أستطيع المساعدة في: الطبيب، الصيدلية، الحلال، الحافلة، المدرسة، الإيجار، الطوارئ، دروس الإنجليزية، العمل.' : 'I can help with: doctor, pharmacy, halal, bus, school, rent, emergency, English classes, and jobs.' };
    return { ...p, speech: l === 'ar' ? `قل بالإنجليزية: ${iso(p.en)}` : `In English, say: "${p.en}". In Arabic, that is: ${p.ar}` };
  },

  async first_week_plan({ city, lang: l }) {
    l = lang(l);
    const order = [['food', 'Day 1: a taste of home', 'اليوم ١: طعم البيت'], ['grocery', 'Day 2: stock the kitchen', 'اليوم ٢: جهّز المطبخ'], ['mosque', 'Day 3: Friday prayer and community', 'اليوم ٣: صلاة الجمعة والجالية'], ['library', 'Day 4: free English classes and internet', 'اليوم ٤: دروس إنجليزية وإنترنت مجاني'], ['bakery', 'Day 5: fresh bread', 'اليوم ٥: خبز طازج'], ['clinic', 'Day 6: know your nearest clinic', 'اليوم ٦: اعرف أقرب عيادة'], ['coffee', 'Day 7: coffee with a new neighbor', 'اليوم ٧: قهوة مع جار جديد']];
    const days = [];
    for (const [need, en, ar] of order) {
      const r = await findPlaces(city, need, 1).catch(() => null);
      days.push({ label: l === 'ar' ? ar : en, need, place: r?.places[0] || null });
    }
    const named = days.filter((d) => d.place);
    const speech = l === 'ar'
      ? `خطة أسبوعك الأول في ${cityAr(city)}: ` + named.map((d) => `${d.label.split(':')[0]}، ${d.place.name_ar || iso(d.place.name)}`).join('؛ ') + '. أرسلت التفاصيل إلى الشاشة.'
      : `Here's your first week in ${city}: ` + named.map((d) => `${d.label.split(':')[0]}, ${d.place.name.replace(/[.!?]+$/, '')}`).join('; ') + '. Details are on screen.';
    return { city, days, attribution: 'Data © OpenStreetMap contributors (ODbL)', speech };
  },
};

export async function runTool(name, args) {
  if (!tools[name]) throw new Error(`Unknown tool: ${name}`);
  return tools[name](args || {});
}
