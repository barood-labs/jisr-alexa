# Jisr · جسر — feel at home in a new city (Alexa+ MCP server)

**Jisr** ("bridge" in Arabic) is a bilingual **Arabic/English Alexa+ add-on**, built as a self-hosted
**MCP server (spec 2025-11-25, Streamable HTTP)**. It helps the 3.5+ million Arabic speakers in the US — and every
newcomer family — settle into a new city by voice:

> "Alexa, ask Jisr where I can get shawarma in Salt Lake City."
> «أليكسا، اسأل جسر عن مواقيت الصلاة اليوم»
> "Alexa, ask Jisr how to say *my son is sick* in English."
> "Alexa, ask Jisr to plan my first week in Houston."

Built for the **Amazon Developer Hackathon — Alexa+ track**. Because the Alexa+ MCP Toolkit / Web Simulator are
partner-only, this repo also ships an **Alexa+ experience simulator** (`public/index.html`): a web page that is a
**real MCP client** (it sends `initialize`, `notifications/initialized`, `tools/list`, `tools/call` to `/mcp` over
Streamable HTTP), with voice in (Web Speech API), voice out (speech synthesis), an "Echo Show" screen and a live
MCP-traffic panel.

## Tools

| Tool | What it does | Data |
|---|---|---|
| `find_places_like_home` | Closest Middle Eastern food, halal food, halal grocery, mosque, bakery, coffee, library, clinic/pharmacy | OpenStreetMap (Overpass + Nominatim), free & keyless; bundled ODbL snapshot for 5 cities |
| `prayer_times` | Today's 5 prayers for a city (ISNA/MWL/Egypt/Makkah/Karachi) | Computed locally, astronomical formula, no API |
| `say_it_in_english` | The exact English sentence (and Arabic) for doctor, pharmacy, halal, bus, school, rent, emergency, classes, jobs | Hand-checked phrasebook |
| `first_week_plan` | 7-day plan: food from home, grocery, Friday prayer, library English classes, bakery, clinic, coffee | Combines the above |

Every result includes `structuredContent` plus a `speech` string in the user's language, so a voice assistant can
read it as-is. Tools carry `readOnlyHint` annotations. No user accounts, no personal data stored — so per the Alexa+
docs, account linking is not needed.

## Alexa+ MCP requirements checklist

- [x] MCP spec **2025-11-25** (`initialize` negotiates it; also accepts 2025-06-18 / 2025-03-26)
- [x] **Streamable HTTP** at `POST /mcp` (JSON responses), `Mcp-Session-Id` issued on initialize, `202` for
  notifications, `405` on GET (no server stream), `DELETE` ends a session, `404` for unknown sessions,
  `MCP-Protocol-Version` header checked, Origin allow-list (`ALLOWED_ORIGINS`)
- [x] Remote URL (deploy below) · [x] < 500 ms round trip for snapshot cities (tested)
- [x] Text-only experience (Echo Show visuals shown by the simulator)

## Run it (Node 20+, zero dependencies)

```bash
git clone https://github.com/baroodstore1-ai/jisr-alexa && cd jisr-alexa
npm start            # MCP at http://localhost:8787/mcp, simulator at http://localhost:8787/
npm test             # offline tests, incl. a full Streamable HTTP session + latency check
```

Try it with curl:
```bash
curl -si localhost:8787/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
# then, with the returned Mcp-Session-Id:
curl -s localhost:8787/mcp -H 'content-type: application/json' -H 'mcp-session-id: <id>' -H 'mcp-protocol-version: 2025-11-25' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"prayer_times","arguments":{"city":"Salt Lake City","lang":"ar"}}}'
```

Use it from any MCP client (MCP Inspector, Claude Desktop, Cursor…): point it at `https://<your-host>/mcp`
(Streamable HTTP), or stdio: `npm run mcp:stdio`.

**Env:** `PORT`, `ALLOWED_ORIGINS` (comma list), `JISR_OFFLINE=1` (snapshot only), `OVERPASS_URL`,
`OSM_USER_AGENT`. Refresh the snapshot with `npm run snapshot`.

**Deploy (free):** Render → New → Blueprint → this repo (`render.yaml`), or `docker build -t jisr . && docker run -p 8787:8787 jisr`.
For a quick public URL from your laptop: `cloudflared tunnel --url http://localhost:8787`.

## Architecture

```
Alexa+ / any MCP client ──Streamable HTTP──▶ /mcp (src/mcp.js) ──▶ tools (src/tools.js)
Simulator (public/index.html) ─┘                                      ├─ geo.js   OSM Overpass/Nominatim + snapshot
  voice in/out · intent router · Echo Show screen                      ├─ prayer.js local astronomy
                                                                       └─ phrases.js EN↔AR phrasebook
```

## Credits & license

MIT (see `LICENSE`). Place data © OpenStreetMap contributors, ODbL 1.0. Not affiliated with or endorsed by Amazon;
"Alexa" is used only to describe the target platform. Built with AI-assisted coding; Arabic reviewed by a native speaker.
