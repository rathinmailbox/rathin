## Custom Advertisements System

### Schema changes — `prisma/schema.prisma`
Expand the existing `Advertisement` model and add a relation to `Post`:
```prisma
model Advertisement {
  id           String   @id @default(cuid())
  text         String
  link         String?              // optional URL ("Buy tickets here")
  bgColor      String   @default("#ff0000")
  textColor    String   @default("#ffffff")
  speed        Int      @default(20)   // seconds per pass — lower = faster
  placement    String   @default("home") // "home" | "inline"
  postId       String?               // required when placement="inline"
  paragraphNum Int?                  // 1-based: insert AFTER this paragraph (0 = top of body)
  enabled      Boolean  @default(true)
  order        Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  post         Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([enabled, placement, order])
  @@index([postId])
}
```
Add `advertisements Advertisement[]` to `Post`. Run `bunx prisma db push` to apply (dev SQLite).

### Types — `src/lib/types.ts`
Add `Advertisement` interface + `placement` union type.

### API routes (all guarded by `requireAdmin` except public reads)
- `src/app/api/admin/advertisements/route.ts` — `GET` (list all) / `POST` (create)
- `src/app/api/admin/advertisements/[id]/route.ts` — `GET` / `PUT` / `DELETE`
- `src/app/api/advertisements/route.ts` — public `GET`, query `?placement=home` or `?placement=inline&postId=...`; returns only `enabled` ads sorted by `order`

### Public components
1. **`src/components/blog/marquee-ad.tsx`** — the reusable scrolling banner.
   - Pure CSS keyframes (`translateX(0) -> -50%`) with the text duplicated once for a seamless loop.
   - Props: `text, link?, bgColor, textColor, speed` (animation-duration = `${speed}s`).
   - Non-blocking: `pointer-events:none` on the track, only the optional link is clickable; `overflow:hidden`; respects `prefers-reduced-motion` (pauses animation).
   - Responsive full-width, fixed height, lightweight (~40 lines).

2. **`src/components/blog/home-ads.tsx`** — client component; fetches `?placement=home`, renders enabled ads stacked vertically (margin between), no surrounding card so it sits flush at the page bottom.

3. **Inline injection inside `article-view.tsx`** (no change to `article-markdown.tsx`):
   - Fetch inline ads for the post (`?placement=inline&postId=...`).
   - Split `body` into paragraph blocks on blank lines (`/\n{2,}/`), render each block with its own `<ArticleMarkdown>`, and after the block whose 1-based index equals an ad's `paragraphNum`, insert a `<MarqueeAd>`.
   - `paragraphNum=0` inserts at the very top. Unknown indices are ignored gracefully.

4. **Wire-up** — render `<HomeAds />` at the bottom of `HomeView` (after the post list). Article view gets the inline logic above.

### Admin components
5. **`src/components/admin/ads-manager.tsx`** — mirrors `AdminDashboard`: table of ads (text preview, placement badge, post title, paragraph #, status, order), row actions (edit/delete via dropdown), "New ad" button, delete confirmation dialog. Fetches `/api/admin/advertisements`.

6. **`src/components/admin/ads-editor.tsx`** — modal-based form (reuse shadcn `Dialog`):
   - Text (textarea), Link (optional text input)
   - Background color + Text color (color inputs)
   - Speed (number input, seconds; live preview marquee at top of dialog)
   - Placement toggle: `home` / `inline`
   - When `inline`: Post select (dropdown of all posts) + Paragraph number input
   - Enabled toggle, Order input
   - Save → POST/PUT; Cancel → close.

7. **Admin integration** — add `'ads'` to the `SubView` union in `admin-app.tsx`, render `<AdsManager>` for that view, and add an "Ads" button next to "Settings" in `admin-dashboard.tsx` (new `onOpenAds` prop).

### Polish / "bonus" coverage
- Multiple ads with different styles → each row is independent (own colors/speed).
- Optional links → clickable, opens in new tab; track is `pointer-events-none` so non-link text never blocks reading.
- Lightweight CMS integration → single self-contained `MarqueeAd` + one API endpoint; no new dependencies.

### Files touched
- **Edit:** `prisma/schema.prisma`, `src/lib/types.ts`, `src/components/blog/home-view.tsx`, `src/components/blog/article-view.tsx`, `src/components/admin/admin-app.tsx`, `src/components/admin/admin-dashboard.tsx`
- **Create:** `src/app/api/admin/advertisements/route.ts`, `src/app/api/admin/advertisements/[id]/route.ts`, `src/app/api/advertisements/route.ts`, `src/components/blog/marquee-ad.tsx`, `src/components/blog/home-ads.tsx`, `src/components/admin/ads-manager.tsx`, `src/components/admin/ads-editor.tsx`

After implementation: run `bunx prisma db push`, then build/typecheck to verify no regressions.