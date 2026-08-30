# Pika Flights

A public, mobile-first flight planner for one shared trip. It includes:

- Multi-flight itinerary planning with dates, times, terminals, gates and booking references
- A grouped packing checklist with custom items and progress
- Cabin and checked-baggage allowances with item-by-item weight totals
- Automatic shared saving through Cloudflare D1
- No login and no PIN
- Installable mobile web-app metadata

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

The local app uses the D1 binding configured by the Cloudflare Vite plugin.

## Connect the repository to Cloudflare

1. Create a D1 database:

   ```bash
   npx wrangler d1 create pika-flights-db
   ```

2. Add these environment variables in the Cloudflare build settings:

   - `CLOUDFLARE_D1_DATABASE_NAME=pika-flights-db`
   - `CLOUDFLARE_D1_DATABASE_ID=` followed by the database ID returned in step 1

3. Apply the included database migration once:

   ```bash
   npx wrangler d1 execute pika-flights-db --remote --file=drizzle/0000_vengeful_blindfold.sql
   ```

4. Use these Git build settings:

   - Build command: `npm install && npm run build`
   - Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`

The app is intentionally public. Anyone with the URL can view and update the shared plan, and the latest edit is saved for every device.

## Main files

- `app/page.tsx` — mobile interface and all three app sections
- `app/api/state/route.ts` — public autosave API
- `db/state.ts` — D1 read/write helper
- `db/schema.ts` — database schema
- `drizzle/` — deployable D1 migration
