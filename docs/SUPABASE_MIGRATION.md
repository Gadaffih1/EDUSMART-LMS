# Supabase Data Migration — EduSmart LMS

This project now stores **all application data in Supabase**, while keeping
`localStorage` as a synchronous cache so the existing ~770 `Storage.*()` call
sites keep working unchanged (hybrid architecture).

```
┌─────────────── React components (unchanged, synchronous) ───────────────┐
│  Storage.getUsers()  Storage.addTopic()  OperationsStorage.addPayment() │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ sync read/write
                    ┌───────────▼────────────┐
                    │  localStorage (cache)  │  ← instant, works offline
                    └───────────┬────────────┘
                                │ SyncEngine (debounced, dirty-set, diff)
                    ┌───────────▼────────────┐
                    │  Supabase              │  ← source of truth, cross-device
                    │  public.app_records    │
                    └────────────────────────┘
```

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Browser client (public/publishable key) |
| `src/utils/syncEngine.ts` | Hydration, diff/push queue, 3-way merge, realtime |
| `supabase/migrations/0001_app_records.sql` | Table, indexes, trigger, RLS, realtime |
| `.env.local` | Your project credentials (git-ignored) |

---

## 1. One-time setup (REQUIRED before data will sync)

1. Open <https://supabase.com> → your project → **SQL Editor**
2. **New query** → paste the entire contents of
   `supabase/migrations/0001_app_records.sql` → **Run**
   (expect: `Success. No rows returned`)
3. Restart the dev server if it is running.

**Verify:** run
```sql
select count(*) from public.app_records;
```
and/or open the app → navbar → **Offline Cache** indicator → the
*School Data (Supabase)* row should read **Synced** (not *Retrying…*).

## 2. Environment variables

`.env.local` (already created for this project, never committed — `.gitignore`
covers `.env*`):

```env
VITE_SUPABASE_URL=https://qysbyegyxvuvfwrruryc.supabase.co   # browser-safe
VITE_SUPABASE_ANON_KEY=sb_publishable_...                    # browser-safe
SUPABASE_SECRET_KEY=sb_secret_...                            # SERVER ONLY
```

> ⚠️ **Never** add a `VITE_` prefix to `SUPABASE_SECRET_KEY` — Vite inlines
> every `VITE_*` variable into the public bundle. The secret key is currently
> unused by the app; because it was shared in plain text, consider rotating it
> (Project Settings → API → *Roll secret key*) when convenient.

## 3. How the sync works

* **Boot** — `src/main.tsx` awaits `SyncEngine.hydrate()` *before* React
  renders (hard-capped at 20 s), so the first paint already contains cloud data.
  A "SYNCING SCHOOL DATA…" splash is shown meanwhile.
* **Write** — every `Storage.setX()` writes localStorage first, then marks the
  collection *dirty*; a 700 ms debounce pushes the diff to Supabase
  (500-row upsert batches).
* **Read** — stays synchronous, served from localStorage. No component changes.
* **Pull** — incremental, using `updated_at` as a cursor
  (`where updated_at >= cursor`), 1000-row pages, 6 collections in parallel.
* **Offline** — pushes stay in a persisted dirty set; they flush on the `online`
  event and every 30 s while pending. Nothing is lost.
* **Realtime** — a single `postgres_changes` channel updates localStorage when
  another device writes, so two open browsers converge without a refresh.
* **UI status** — navbar → Offline Cache popover → *School Data (Supabase)*
  (Synced / Syncing… / Offline – Queued / Retrying… / Local Only) plus a
  **Sync School Data Now** button (`SyncEngine.syncNow()`).

### Data model

Everything lives in one table keyed by collection:

| column | meaning |
|---|---|
| `collection` | the old localStorage key, e.g. `edusmart_users_v1` (~110 collections) |
| `record_id` | entity `id` inside that collection (or `singleton` for object values) |
| `payload` | the full JSON record |
| `tenant_id` | school tenant at write time (metadata for future RLS) |
| `deleted` | tombstone so deletions replicate |
| `updated_at` | **server** clock (trigger) — drives the pull cursor |

### Conflict policy (3-way merge against a local "mirror" of last-synced state)

| situation | winner |
|---|---|
| cloud changed, this device untouched | **cloud** |
| this device changed, cloud untouched | **device** |
| both changed (or local edit vs remote delete) | **device** (pushed over cloud) |
| first ever sync of a collection, cloud has rows | **cloud** (protects primary copy) |
| first ever sync of a collection, cloud empty | **device** (local seeds uploaded) |

Known limitation: on the *first* sync of a brand-new collection, local edits
made while completely offline are replaced by the cloud copy.

## 4. What is NOT synced (deliberately per-device)

`edusmart_current_user_v1` (session), `edusmart_active_tenant_id`,
the CBC offline content cache, accessibility/mobile-layout preferences.

## 5. Security notes / next steps

* RLS is **enabled with permissive policies** because the app has no Supabase
  Auth session yet (login is app-side). This is the same trust level as the
  previous localStorage-only build, but now tightening is a *policy edit*:
  sign users in with Supabase Auth, put `tenant_id` in the JWT, then replace
  `using (true)` in `0001_app_records.sql`.
* Passwords are still not verified at login and data is still shared across
  tenants inside one browser — migrating storage does not fix that; both need
  the auth work above.
* `docs/001_core_schema.sql` (normalised Finance/HR/Stores tables) remains a
  future target: hot tables can be split out of `app_records` later without
  touching the UI, since all access already goes through `Storage`/
  `OperationsStorage`.

## 6. Rollback

Remove the two `VITE_SUPABASE_*` variables from `.env.local` and restart —
`SyncEngine` detects the missing config, reports **Local Only**, and the app
runs exactly as before on localStorage.
