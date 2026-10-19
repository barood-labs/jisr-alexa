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
- **Would we build with these again? Yes.** MCP made one server usable by Alexa+ and by every other MCP client, and voice is the right interface for the families Jisr serves. We would build the account-linked version as soon as the Alexa+ MCP Toolkit opens up.

## Friction log
1. **Task:** test the MCP server inside a real Alexa+ device or the Web Simulator. **Steps:** followed the Alexa+ MCP QuickStart, then looked for Toolkit/Simulator access. **Expected:** a self-serve sandbox. **Actual:** the tools are partner-only, and individual pages don't say so. **Severity:** high. **Workaround:** built our own simulator that is a real MCP client. **Suggestion:** say "partner-only" on every setup page and offer a public, text-only validator for MCP add-ons.
2. **Task:** support Arabic speakers. **Steps:** searched the Alexa+ docs for supported locales. **Expected:** a locale list for add-ons. **Actual:** Arabic availability isn't documented. **Severity:** medium. **Workaround:** every tool returns both English and Arabic `speech`. **Suggestion:** publish the locale matrix for Alexa+ add-ons.
3. **Task:** meet the <500 ms latency budget with live OpenStreetMap data. **Steps:** called public Overpass servers. **Expected:** sub-second replies. **Actual:** 5–30 s at busy times. **Severity:** medium (third-party). **Workaround:** bundled ODbL snapshot plus a short live-query budget. **Suggestion:** document recommended timeout and retry behavior for slow tool backends.

## Feature requests
- **Public MCP add-on validator / sandbox** (Critical): lets builders without partner access prove their server works with Alexa+.
- **Arabic locale for Alexa+ add-ons** (Important): Jisr's main users speak Arabic first.
- **MCP Apps / visual cards on Echo Show for add-ons** (Nice-to-have): show the place list and prayer table on screen.

## Track, mini challenges and project timing
- **Primary track:** Alexa+ (self-hosted MCP server, spec 2025-11-25, Streamable HTTP), shown through our simulated Alexa+ experience.
- **Mini challenges:** none entered.
- **New project:** Jisr was created during the Submission Period (October 2026). All code in the repo was written for this hackathon.

## Testing instructions
No login needed. Open https://jisr-alexa.onrender.com/ (free hosting may take ~30 s to wake), tap a suggestion chip or type a question, and toggle العربية for Arabic. Or point any MCP client (e.g. MCP Inspector) at https://jisr-alexa.onrender.com/mcp over Streamable HTTP. Locally: `git clone https://github.com/baroodstore1-ai/jisr-alexa && cd jisr-alexa && npm start && npm test` (Node 20+, no dependencies).

## Links
- Code: https://github.com/baroodstore1-ai/jisr-alexa (MIT)
- Live MCP endpoint + simulator: https://jisr-alexa.onrender.com/mcp and https://jisr-alexa.onrender.com/
- Demo video: <YOUTUBE_URL>
