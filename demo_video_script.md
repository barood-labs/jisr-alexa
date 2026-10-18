# Demo video script — Jisr · جسر (target 2:40, must be < 3:00)

Format: screen recording of the simulator at the LIVE URL (1920×1080), Kokoro TTS narration (or the user's voice),
no copyrighted music (silence or a self-made/CC0 bed). Upload to YouTube **Public** on the "Satr Tools" channel.
Title: "Jisr · جسر — Alexa+ MCP add-on for Arabic-speaking newcomers (Amazon Developer Hackathon)".

| Time | Screen | Narration |
|---|---|---|
| 0:00–0:15 | Title card: "Jisr · جسر — feel at home in a new city" over the simulator | "Moving to a new country, your first questions aren't in a guidebook. Where's halal food? When is Maghrib? How do I tell the pharmacist my son is sick? Jisr answers them, by voice, in Arabic or English." |
| 0:15–0:30 | Architecture diagram from README | "Jisr is an Alexa+ add-on built as a self-hosted MCP server, spec 2025-11-25, over Streamable HTTP. Because Alexa+ developer tools are partner-only, this simulator is a real MCP client talking to the live server." |
| 0:30–0:45 | Page loads; MCP traffic panel shows initialize → 2025-11-25, tools/list → 4 tools | "Watch the right panel: initialize negotiates protocol 2025-11-25 and we get a session ID; tools/list returns four tools." |
| 0:45–1:10 | Click mic, say "Where can I get shawarma in Salt Lake City?" → spoken answer, Echo Show list, tools/call in panel with ms timing | "Ask in English… Jisr finds the closest Middle Eastern restaurants from OpenStreetMap, with distance and halal tags, in under half a second, inside Alexa+'s latency budget." |
| 1:10–1:35 | Toggle العربية; tap «مواقيت الصلاة اليوم» → Arabic voice reply, prayer table | "Switch to Arabic, and the same server answers in Arabic. Prayer times are calculated on the server, with no API." |
| 1:35–1:55 | Type «كيف أقول ابني مريض؟» → English sentence + Arabic | "Not sure what to say at the clinic? Jisr gives the exact English sentence." |
| 1:55–2:20 | "Plan my first week in Houston" → 7-day list on screen | "And a first-week plan: food from home, a halal grocery, Friday prayer, free English classes at the library, the nearest clinic, each one a real place." |
| 2:20–2:35 | Terminal: `npm test` all passing; curl initialize showing Mcp-Session-Id | "It's open source under MIT, has zero dependencies, and its tests cover the full Streamable HTTP session and the 500-millisecond target." |
| 2:35–2:45 | End card: repo URL + live URL | "Jisr. A bridge home, wherever you land." |

Recording on the box (when `free -g` ≥ 3 GB or overnight, under `flock /workspace/.heavy_job.lock`):
headless Chrome is not required — use the box desktop browser + `ffmpeg -f x11grab`, then mix Kokoro narration.
Browser speechSynthesis may be silent on the box; overlay the Kokoro clips for Jisr's replies instead.
