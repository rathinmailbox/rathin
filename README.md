# rathin.blog

A Gawker-style editorial blog with an admin panel, Tufte CSS sidenotes, an RSS feed, and a question-mark easter egg.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + shadcn/ui
- **Prisma** (SQLite)
- **MDXEditor** for rich-text editing
- **react-markdown** + **rehype-raw** for article rendering
- **next-themes** for dark mode

## Getting started

```bash
# 1. Install dependencies
bun install

# 2. Copy the env template and edit if needed
cp .env.example .env

# 3. Create the database + seed sample posts
bun run db:push
bun run prisma/seed.ts

# 4. Start the dev server
bun run dev
```

The site runs at `http://localhost:3000`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — article list |
| `/article/{slug}` | Single article (with margin footnotes) |
| `/about` | About page |
| `/admin` | Admin panel (password: `admin123` — change via `ADMIN_PASSWORD` env var) |
| `/feed` | RSS feed |

## Features

- **No-code admin panel** — write posts with a rich-text editor, generate AI cover images, edit site settings.
- **Tufte CSS sidenotes** — use `[[note text]]` in the editor to add margin footnotes.
- **Easter egg** — hover the period in the "rathin." wordmark to reveal a question mark linking to /about.
- **RSS feed** at `/feed`.
- **Dark mode** toggle (top-right).
- **Clean URLs** — `/admin`, `/about`, `/article/slug`.

## Customizing

- **Site name / tagline / about / accent color**: edit in the admin panel → Settings.
- **Admin password**: set `ADMIN_PASSWORD` in `.env`.
- **Fonts**: swap the `--fontFamilyHeadingSerif` / `--fontFamilyHeadingSansSerif` CSS variables in `src/app/globals.css`.

## License

MIT
