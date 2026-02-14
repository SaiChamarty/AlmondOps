# Almond Risk Report MVP

Farmer-first hackathon MVP built with Next.js App Router, TypeScript, TailwindCSS, and zod validation.

## Reality check on data

- The report is **not fully accurate agronomic guidance** yet.
- It uses a **prototype risk model** (rule-based scoring), not crop-science validated thresholds.
- Weather inputs are near real-time **when provider fetch succeeds**; otherwise it falls back to local deterministic stub values.
- Insect/disease risk is currently inferred from simple weather heuristics (humidity/conditions), not pest monitoring feeds.

## Data source

- Primary provider: **Open-Meteo** forecast API (`api.open-meteo.com`)
- Fetched variables: hourly temperature, humidity, precipitation, and wind
- If provider is unavailable, backend uses a deterministic fallback signal generator so demo still works

## What it does

- Minimal one-page workflow with checkbox-focused inputs
- `Run Report` calls `POST /api/risk-report`
- Backend fetches weather signals (Open-Meteo, with fallback) and creates a JSON artifact in `data/`
- Frontend renders:
  - Top Risks (next 72 hours)
  - Before / During / After checklists
  - Assumptions
  - Chat-style status area showing `JSON file created: ...`
  - Follow-up question input (captured for future LLM integration)

## Major California almond areas included

- Fresno Area
- Kern (Bakersfield) Area
- Stanislaus (Modesto) Area
- Merced Area
- Madera Area
- Davis (added per request)

## High-level working

1. User selects crop stage, location, and hazard checkboxes, then clicks `Run Report`.
2. Frontend sends payload to `POST /api/risk-report`.
3. Backend validates input with zod.
4. Backend maps location to lat/lon and calls Open-Meteo for 72-hour hourly forecast signals.
5. Backend transforms weather signals into normalized risk signals (frost/heat/rain-wind/insect-pressure heuristics).
6. Backend generates a structured risk report JSON (top risks + before/during/after actions + assumptions).
7. Backend writes a full artifact file under `data/risk-report-<timestamp>.json`.
8. Backend returns report + provider + JSON file path.
9. Frontend renders the report and shows `JSON file created: ...` in chat-style output.
10. User can type follow-up questions (captured in UI for later LLM integration).

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
