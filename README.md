# The Clan App — setup guide

This is the scaffold: project structure, database schema, login, the
relationship engine, and rough (unstyled) versions of the tree, timeline,
and profile pages. The visual design pass comes next, once this is
confirmed working end to end.

Follow these steps in order the first time.

## 1. Install dependencies

```bash
npm install
```

## 2. Create your Neon database

1. Go to https://neon.tech and sign up (free tier is enough for this).
2. Create a new project — name it something like `clan-app`.
3. On the project dashboard, click **Connect** / **Connection Details**.
4. Switch the snippet format to **Prisma** if offered — Neon will hand
   you a connection string already in the exact shape Prisma expects.
5. Copy that string.

## 3. Set up your local environment file

```bash
cp .env.example .env
```

Open `.env` and:
- Paste your Neon connection string into `DATABASE_URL`.
- Generate a real secret for `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```
  (If you're on Windows without `openssl`, any long random string works —
  it just needs to be unpredictable and kept secret.)
- Leave `NEXTAUTH_URL` as `http://localhost:3000` for now.
- Leave `BLOB_READ_WRITE_TOKEN` blank until step 7 (Vercel Blob) — the
  app runs fine without it, you just can't upload photos yet.

## 4. Create the database tables

This reads `prisma/schema.prisma` and creates matching tables in your
Neon database:

```bash
npx prisma migrate dev --name init
```

You should see it create a `prisma/migrations/` folder and confirm
success. If it errors on connecting, double-check the `DATABASE_URL`
value (a common mistake is missing `?sslmode=require` at the end).

## 5. Seed some example data

```bash
npm run seed
```

This inserts the 5-person example family from `scripts/seed.ts` so you
have something to click around. It'll print out the generated usernames
— note them down, everyone's temporary password is `aparticularword`
(defined at the top of that file).

Open `npx prisma studio` any time to see the data in a spreadsheet-like
browser view, or to manually check what got created.

## 6. Run the app locally

```bash
npm run dev
```

Visit http://localhost:3000 — you should land on `/login` (middleware
redirects you there since you're not signed in). Log in with one of the
seeded usernames + `aparticularword`; you'll be forced to set a real
password immediately, then land on the home page.

## 7. Set up Vercel Blob (for profile photos) — optional for now

You can skip this until you're ready to add real photos.

1. Push this project to a GitHub repo (see step 8 first if you haven't).
2. In your Vercel project dashboard: **Storage** tab -> **Create
   Database** -> **Blob**.
3. Vercel will offer to add the resulting `BLOB_READ_WRITE_TOKEN`
   straight into your project's environment variables — accept that.
4. For local development, copy that same token value into your local
   `.env` file too.

(The actual upload code isn't wired up yet in this scaffold — that
comes with the profile-editing UI, once the visual design is settled.)

## 8. Deploy to Vercel

1. Push this project to a new GitHub repository.
2. Go to https://vercel.com, sign in, and click **Add New -> Project**,
   then import that repo.
3. Before the first deploy, add your environment variables under
   **Settings -> Environment Variables** (or Vercel will prompt you
   during import):
   - `DATABASE_URL` — same Neon connection string as your local `.env`.
   - `NEXTAUTH_SECRET` — same value as local, OR generate a fresh one
     for production (fine either way, they don't need to match).
   - `NEXTAUTH_URL` — your real Vercel URL once you know it, e.g.
     `https://clan-app.vercel.app` (you can update this after the first
     deploy gives you the URL).
4. Deploy. Vercel runs `npm run build` automatically.
5. One extra one-time step: run the migration against your PRODUCTION
   database too (it's the same Neon database as local in this setup, so
   if you already ran `prisma migrate dev` locally against it, you're
   already done — you only need to re-run migrations if you later
   create a SEPARATE production database).

## What's already working

- Login/logout with per-person username + password (`lib/auth.ts`).
- Forced password change on first login (`middleware.ts` +
  `/change-password`).
- Database schema for people, parent/child edges, marriages, and
  timeline events (`prisma/schema.prisma`).
- A relationship engine that computes things like "your grandmother" or
  "your first cousin, once removed" between the logged-in viewer and
  whoever's profile they're looking at (`lib/relationship.ts`).
- Rough, unstyled versions of: the 3D family tree (`/tree`), the
  timeline (`/timeline`), and an individual's profile (`/person/[id]`).

## What's intentionally NOT done yet

- Any real visual design — every page right now is bare HTML +
  minimal Tailwind, on purpose, so we could confirm data/auth/3D
  rendering works before spending time on styling that might get
  reworked anyway.
- Photo upload UI (Vercel Blob is set up per step 7, but no upload
  form exists yet).
- In-law relationships in the relationship engine (spouse's siblings,
  etc.) — see the comment at the top of `lib/relationship.ts`.
- A UI for adding/editing people and events — right now that only
  happens via `npm run seed` or `npx prisma studio`.

## Next step

Once you've run through steps 1–6 locally and confirmed login, the
tree, and a profile page all work, let's move on to the actual visual
design pass using your reference images.
