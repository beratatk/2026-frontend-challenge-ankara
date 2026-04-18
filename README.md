# Missing Podo — Ankara Case

## User Information

- **Name:** Berat Atak

---

An investigation workspace that links checkins, messages, sightings, personal notes, and anonymous tips into a single, searchable case file. Built in 3 hours for the Jotform 2026 Frontend Challenge.

## Product summary

Five independent Jotform forms describe the same night in Ankara. This app cross-references them to answer investigation questions: where was Podo last seen, who was with them, which tips are corroborated, and which people show the strongest signals worth investigating further.

## Approach

The brief asks for "meaningful connections, not just raw data." The app treats record linking as a first-class concern, not a side effect of filtering:

- Every record from every source is normalized into a single shape.
- A person index keyed by Turkish-normalized names merges `Aslı` and `asli`, `Kağan` and `kagan`.
- Records that share a location within a 30-minute window cluster into cross-source events.
- Each non-subject person gets an explainable list of investigation signals — never summed into a single "guilt score." Each signal carries its own reason and evidence trail.
- Insight cards, the timeline, and the map all read from the same derived graph. Change a rule in one place, every surface updates.

No raw JSON is dumped. Every view transforms data into investigator-friendly labels (e.g. `Aslı → Podo`, `Tip about Kağan (high confidence)`, `2 / 5 corroborated tips`).

## Features

**Core**
- Data fetching across 5 Jotform sources with key rotation and per-source error isolation
- Unified record normalization (Turkish name handling, DD-MM-YYYY date parsing, coordinate parsing)
- Record linking: people index, cross-source event clustering, alias hints (Levenshtein ≤ 1, never auto-merged)
- Investigation feed with free-text search, source toggles, location picker, person filter, and active-filter chips
- Detail pane for records and people, with "related records at the same event" and clickable role-aware person chips
- 6 insight cards: last known location, last seen with, most linked contact, highest investigation score, sightings of Podo, corroborated tips
- Loading / empty / partial-failure / total-failure states, all with retry

**Bonus**
- Chronological timeline view centered on Podo (date separators, same-event dot coding)
- Leaflet + OpenStreetMap map view with per-location pins (amber for Podo-linked, gray for others, rose for selected)
- Responsive layout: mobile tabs, tablet drawer, desktop 3-column

## Tech stack

- React 18 + TypeScript (strict)
- Vite 5
- Tailwind CSS 3
- TanStack Query 5 (parallel queries, partial-success handling, retry)
- Leaflet + react-leaflet (OpenStreetMap tiles, no API token required)

## Getting started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install and run

```bash
git clone <repo-url>
cd 2026-frontend-challenge-ankara
npm install
# create .env.local — see "Environment variables" below
npm run dev
```

Then open `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview
```

## Environment variables

Create a `.env.local` file at the project root with the values provided by the challenge organisers. The file is gitignored — never commit real keys.

```bash
VITE_JOTFORM_API_KEYS=<key-a>,<key-b>,<key-c>
VITE_FORM_CHECKINS=<form-id>
VITE_FORM_MESSAGES=<form-id>
VITE_FORM_SIGHTINGS=<form-id>
VITE_FORM_NOTES=<form-id>
VITE_FORM_TIPS=<form-id>
```

`VITE_JOTFORM_API_KEYS` accepts a comma-separated list. The API client rotates across keys and falls back to the next one on HTTP 429.

## How linking works

1. **Fetch.** `useQueries` pulls all 5 sources in parallel. A failure on one source never blocks the others — the app renders partial data with a retry banner.
2. **Normalize.** Each Jotform submission becomes an `InvestigationRecord` with `source`, `timestamp`, `personRefs` (normalized keys), `personsDisplay` (original names), `location`, `coordinates`, `content`, and `roleByPerson` (sender, recipient, suspect, witness, etc.).
3. **Build the graph.**
   - `buildPeopleIndex` aggregates per-person stats, top locations, co-occurrences, and possible aliases.
   - `buildEvents` clusters records sharing the same location within a 30-minute window — this is what lets a checkin and a sighting at CerModern five minutes apart collapse into one event.
   - `buildProfiles` computes tunable-weight suspicion signals per non-subject person (named-in-tip, co-occurrence-with-subject, mentioned-with-subject, last-known-with-subject, location-overlap, nighttime-contact).
4. **Derive insights.** Six explainable metrics for the summary strip (last known location, corroborated tips, etc.).

All thresholds and weights live in `src/lib/linking.ts` (`SIGNAL_WEIGHTS`, `EVENT_WINDOW_MIN`, `ALIAS_MAX_EDIT_DISTANCE`) so they are easy to tune.

## Assumptions and tradeoffs

- **Names are first-name-only and clean in the data.** Exact case-insensitive match after Turkish normalization is reliable enough. Levenshtein ≤ 1 hints surface as "possible aliases" but are never auto-merged.
- **`Podo` is the hardcoded subject** via `SUBJECT_KEY` in `src/lib/linking.ts`. Making it dynamic is a one-line change.
- **Events cluster by exact location string + 30-minute window.** Coordinate-based clustering is the natural next step if locations start to vary in spelling.
- **Signal weights are editorial, not statistical.** They are explicit constants, designed to iterate on — never presented to the user as a final verdict.
- **No URL state sync.** Filters and selection live in React state only. Fine for a demo, would be wired to search params before shipping.
- **No automated tests.** The pure functions in `src/lib/` (normalize, linking, insights, filter) are the obvious first place to add them.

## Priorities for the 3-hour challenge

Shipped in this order, each layer validated before moving on:

1. Data layer — API client with key rotation and pagination
2. Normalization — single record shape, Turkish name handling, date parsing
3. Linking engine — people, events, profiles, insights
4. Investigation UI — feed, filters, person/record detail pane
5. Insight cards — turn the graph into investigator-friendly metrics
6. State handling — loading, empty, error with per-source isolation
7. Timeline view (bonus)
8. Map view (bonus)
9. Responsive layout (polish)

Functional correctness and explainability beat visual flash. The bonus views only landed because the linking engine underneath them was stable.

## Project structure

```
src/
  api/           # Jotform fetch + 3-key rotation
  types/         # RawSubmission, InvestigationRecord
  lib/
    normalize.ts # source mappers, TR-aware names, date/coord parsers
    linking.ts   # people index, event clustering, suspicion signals
    insights.ts  # 6 derived metrics consumed by the summary strip
    filter.ts    # unified Filters shape + applyFilters
    format.ts    # human-friendly labels and record titles
  hooks/
    useInvestigation.ts   # single hook, returns the whole derived graph
  components/    # Header, SummaryStrip, LeftRail, Feed, Timeline,
                 # MapView, DetailPane, atoms, LoadingScreen,
                 # ErrorScreen, PartialFailureBanner, MobileTabs,
                 # DetailDrawer, ViewToggle
  App.tsx        # layout + selection/filter state orchestration
```
