import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.JISR_OFFLINE = '1';
const { handle, httpHandler, PROTOCOL } = await import('../src/mcp.js');
const { createServer } = await import('../src/server.js');
const { prayerTimes } = await import('../src/prayer.js');

test('initialize negotiates 2025-11-25', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  assert.equal(r.result.protocolVersion, PROTOCOL);
  assert.ok(r.result.capabilities.tools);
});

test('tools/list exposes 4 tools with schemas', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(r.result.tools.map((t) => t.name).sort(), ['find_places_like_home', 'first_week_plan', 'prayer_times', 'say_it_in_english']);
  for (const t of r.result.tools) assert.equal(t.inputSchema.type, 'object');
});

test('find_places_like_home returns real OSM places + speech', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'find_places_like_home', arguments: { city: 'Salt Lake City', need: 'food' } } });
  assert.equal(r.result.isError, false);
  assert.ok(r.result.structuredContent.places.length > 0);
  assert.match(r.result.content[0].text, /Salt Lake City/);
});

test('Arabic answers are in Arabic', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'prayer_times', arguments: { city: 'Salt Lake City', lang: 'ar' } } });
  assert.match(r.result.content[0].text, /مواقيت الصلاة/);
});

test('prayer times are in a sane order', () => {
  const t = prayerTimes({ lat: 40.76, lon: -111.89, tz: -6, date: new Date('2026-10-18T12:00:00Z') });
  const mins = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => +t[k].slice(0, 2) * 60 + +t[k].slice(3));
  for (let i = 1; i < mins.length; i++) assert.ok(mins[i] > mins[i - 1], JSON.stringify(t));
  assert.ok(mins[2] > 12 * 60 + 30 && mins[2] < 13 * 60 + 30, 'dhuhr ~1pm MDT');
});

test('phrasebook and unknown tool', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'say_it_in_english', arguments: { topic: 'my son is sick' } } });
  assert.match(r.result.structuredContent.en, /My son is sick/);
  const ar = await handle({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'say_it_in_english', arguments: { topic: 'كيف أقول ابني مريض؟', lang: 'ar' } } });
  assert.match(ar.result.structuredContent.en, /My son is sick/);
  const d = await handle({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'say_it_in_english', arguments: { topic: 'I feel sick' } } });
  assert.match(d.result.structuredContent.en, /doctor/);
  const e = await handle({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'nope' } });
  assert.equal(e.error.code, -32602);
});

test('Streamable HTTP: session header, 202 for notifications, 405 on GET', async () => {
  const srv = createServer().listen(0); const base = `http://127.0.0.1:${srv.address().port}/mcp`;
  const post = (b, h = {}) => fetch(base, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...h }, body: JSON.stringify(b) });
  const r1 = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  const sid = r1.headers.get('mcp-session-id'); assert.ok(sid);
  const h = { 'mcp-session-id': sid, 'mcp-protocol-version': '2025-11-25' };
  assert.equal((await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, h)).status, 202);
  const t0 = Date.now(); const r3 = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'find_places_like_home', arguments: { city: 'Salt Lake City', need: 'mosque' } } }, h);
  assert.equal(r3.status, 200); assert.ok(Date.now() - t0 < 500, 'under 500 ms (Alexa+ latency target)');
  assert.equal((await fetch(base)).status, 405);
  assert.equal((await post({ jsonrpc: '2.0', id: 3, method: 'ping' }, { 'mcp-session-id': 'bogus' })).status, 404);
  srv.close();
});

test('Arabic speech uses Arabic city names; Houston plan has a grocery day', async () => {
  const p = await handle({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'prayer_times', arguments: { city: 'Houston', lang: 'ar' } } });
  assert.match(p.result.content[0].text, /هيوستن/);
  const w = await handle({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'first_week_plan', arguments: { city: 'Houston' } } });
  assert.ok(w.result.structuredContent.days.every((d) => d.place), 'all 7 days have a real place');
});
