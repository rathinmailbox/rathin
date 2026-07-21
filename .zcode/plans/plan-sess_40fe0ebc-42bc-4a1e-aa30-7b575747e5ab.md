## Fix: Ads not working in admin panel

**Root cause hypothesis:** The dev server was already running when new route files and components were added. Next.js App Router sometimes doesn't hot-reload new `route.ts` files or new component imports properly, causing client-side compilation errors that silently break the UI.

**Steps:**
1. Kill the running dev server and restart fresh to pick up all new files
2. Test the full admin ad flow (open ads page → new ad → fill form → save → verify in list → edit → delete)
3. Check for any runtime errors in browser console / server logs
4. If there's a real code bug (not just a hot-reload issue), fix it
5. Verify the ad renders correctly on the homepage and inline in articles