# Mira ZamPen: Zamboanga Peninsula transparency portal

A fork of [bettergovph/transparency-portal](https://github.com/bettergovph/transparency-portal)
for Region IX: Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay, Zamboanga City
and Isabela City.

What this fork adds:

| Page | What it shows |
| --- | --- |
| `/` | Every FY 2027 project in the region: NEP vs House Bill 10858, with source pages |
| `/rehiyon` | **By province**: NEP total, House total, change, House-only lines (insertion candidates) and NEP-only lines (dropped), per province/city |
| `/kongreso` | **By congressman**: each Region IX district, its representative, Tier A/B, NEP vs House and House-only lines in its DPWH offices. Says "in the district", never "inserted by" |
| `/crimen` | **Crime**: reported incidents per 100,000 people, from `public/data/crime.csv`, plus a ready-to-file PNP FOI request |
| `/gaa` | Enacted budgets 2020–2026 |

Branding: vinta-sail colours and mark (`public/brand/mira-zampen.svg`), Chavacano greeting.
All set in `portal.config.ts` under `brand`. Have a native Chavacano speaker check the wording.

## 1. Run it locally

```bash
npm install
npm run check -- --verbose   # every office should return rows; 0 rows = wrong name
npm run dev                  # http://localhost:5132
```

If an office shows 0 rows, run `npm run setup` to see the exact names the API uses and fix
`portal.config.ts`. Add legislative district ids (e.g. `leg:zamboanga-del-norte:1st`) to
`scope.districts` for the representative cards.

## 2. Host it on Cloudflare (free)

**Option A: connect GitHub (auto-deploys on every push)**
1. Go to dash.cloudflare.com, then Workers & Pages, then Create, then Import a repository.
2. Pick this repo. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
3. Deploy. You get `https://mira-zampen.<your-subdomain>.workers.dev`.

**Option B: from your laptop**
```bash
npx wrangler login
npm run deploy:cloudflare
```

Then put the URL in `siteUrl` in `portal.config.ts`. A custom domain (e.g. `mirazampen.ph`)
can be added under the Worker's Settings, then Domains & Routes.

## 3. Fill in the crime data

1. File the FOI request shown on `/crimen` at https://www.foi.gov.ph/agencies/pnp/.
2. Add one row per area, period and crime type to `public/data/crime.csv`.
   Use PSA census population and keep `source_url` for every row.
3. Commit; Cloudflare redeploys.

The current CSV has one sourced example row (Zamboanga City theft, Sep 2023–Jan 2024, via PIA).
