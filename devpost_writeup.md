# Jisr · جسر — Devpost submission text (Alexa+ track)

**Tagline:** A bilingual Alexa+ add-on (self-hosted MCP server) that helps Arabic-speaking newcomers feel at home in a new US city — by voice.

## Inspiration
Moving to a new country, the first questions aren't in a guidebook: *Where can I buy halal meat? When is Maghrib here? Where's the mosque for Friday prayer? How do I tell the pharmacist my son has a fever?* Millions of Arabic-speaking families in the US — refugees, students, new immigrants — ask these every week, often while their English is still growing. Grandparents and parents are exactly the people who find voice easier than apps. Alexa+ is in the kitchen already; it should speak their language and know their needs.

## What it does
Jisr is an Alexa+ add-on implemented as a self-hosted MCP server with four tools:
- **find_places_like_home** — closest Middle Eastern restaurants, halal food, halal groceries, mosques, bakeries, coffee, public libraries (free English classes) and clinics, with distance, hours and an Arabic name when known.
- **prayer_times** — today's five prayers for any city, computed locally with the standard astronomical method (ISNA, MWL, Egypt, Makkah, Karachi).
- **say_it_in_english** — the exact sentence to say at the doctor, pharmacy, school, bus, landlord or in an emergency, in English with the Arabic meaning.
- **first_week_plan** — a 7-day "feel at home" plan with a real place for each day.

Every answer comes back as structured content plus a `speech` string in the user's language (Arabic or English), so Alexa+ can read it aloud with no extra work.

## How we built it
- MCP spec **2025-11-25** over **Streamable HTTP** (`POST /mcp`), zero-dependency Node 20: session IDs, 202 for notifications, protocol-version header checks, Origin allow-list, rate limiting.
- Free, open, keyless data: **OpenStreetMap** via Overpass and Nominatim, with a bundled ODbL snapshot for 5 cities so answers return in **under 500 ms**, matching Alexa+'s latency requirement. Prayer times are pure math — no API.
- Since the Alexa+ MCP Toolkit and Web Simulator are partner-only, we built an **Alexa+ experience simulator**: a web page that is a real MCP client, with voice input, spoken replies, an Echo Show-style screen and a live panel showing every JSON-RPC message.
- Automated tests cover the MCP handshake, every tool, Arabic output, prayer-time sanity and a full HTTP session with a latency assertion.

## Challenges
Public Overpass servers can take 30+ seconds, far too slow for voice, so we added a snapshot layer with a short live-query budget. Arabic needs RTL rendering and Arabic voices, and city names arrive in Arabic script ("هيوستن"), so the simulator maps them.

## Accomplishments
A fully working, standards-compliant MCP server that any MCP client can use today, and a voice experience in Arabic as well as English.

## What we learned
MCP's tool annotations, structured content and the Streamable HTTP session model map very cleanly onto voice. Designing every result around a single spoken sentence made the tools better for chat agents too.

## What's next
Account linking (OAuth 2.1 + PKCE) for saved home city and family reminders, Echo Show visuals via MCP Apps, more languages (Dari, Pashto, Somali, Spanish), and partnerships with refugee resettlement agencies.

## Built with
Node.js, Model Context Protocol (2025-11-25, Streamable HTTP), OpenStreetMap (Overpass, Nominatim), Web Speech API, Render.

## Product feedback (required)
- **Tools used:** Alexa+ MCP QuickStart and account-linking docs (to shape the server), MCP spec 2025-11-25, MCP Inspector-style testing via our own client.
- **What worked well:** The QuickStart's requirement list is concrete (Streamable HTTP, 401/PRM rules, <500 ms) and easy to test against; saying account linking is optional for non-personal tools saved time.
- **What needs work:** Individual setup pages don't say the MCP Toolkit / Web Simulator are partner-only, so it took time to learn we couldn't test on a real Alexa+. A public sandbox or validator for MCP add-ons (even text-only) would help hackathon builders a lot. Arabic locale availability for Alexa+ isn't documented.
- **Onboarding:** Zero to a working MCP server was under an hour from the spec; the blocker was only the gated Alexa+ tooling.

## Links
- Code: https://github.com/baroodstore1-ai/jisr-alexa (MIT)
- Live MCP endpoint + simulator: <LIVE_URL>/mcp and <LIVE_URL>/
- Demo video: <YOUTUBE_URL>
