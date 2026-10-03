# Mughal Auto — Angular inventory PWA

Angular 21, Tailwind 4 and the existing Firebase Authentication / Firestore backend. Routes and inventory features are retained, including monthly profit/loss, supplier payments, receipts and the public portfolio.

## Interface

Navy (#0C1140), purple (#1C1452), gold (#F6B21B) and orange (#EE7B1E), with white surfaces on #F8FAFC. Inter is preferred from locally installed fonts; system fonts are the fallback. No external font stylesheet or build-time font download is used. The desktop navigation collapses; the mobile drawer contains every workspace route. Tables become labeled cards on small screens. Dialog heights respond to the visible viewport, including keyboard changes. Reduced-motion preferences are respected.

## Development and release

- `npm start` runs the existing development server. Service worker registration is deliberately disabled in Angular development mode.
- When authorized, `npm run build` compiles the app and runs `scripts/prepare-pwa.mjs`. The packaging step hashes the output and embeds all local application assets (including lazy route chunks) into the service worker. Do not deploy a raw `ng build` output without running that packaging step.
- Deploy the generated `dist/inventory-app/browser` folder over HTTPS. Firebase Hosting headers are configured in `firebase.json`.
- Deploy the updated Firestore rules before using queued writes. New private, immutable `/offlineOperations/{uid}/receipts/{id}` documents provide idempotency. Existing permissions on inventory documents still apply to every transaction.
- No new runtime dependencies were added.

## Offline behavior

`OfflineDataService` downloads complete collections as they are opened and stores them in an IndexedDB record keyed by authenticated UID. Firestore itself retains its default memory cache; the service worker caches only static app assets. Public portfolio reads follow existing backend permissions, and anonymous data is not persisted in an account cache.

After a successful server download, that account can reopen the app and read the collection offline. Missing downloads are explicitly marked unavailable. Reports calculate from downloaded data, including projected pending changes; pending status is shown in the workspace. The Sync center lists download timestamps. External gallery image URLs, maps, videos, and first-time sign-in require a connection.

All supported inventory saves first commit a durable local operation to IndexedDB. A form is not considered saved if storage fails. Pending operations survive closing the app. The worker processes them automatically while the app is open, when a connection returns, and on reopening. This does not promise synchronization while the browser/PWA is fully closed.

Each operation has stable document IDs and a stable receipt ID. Server writes and their receipt commit atomically in one Firestore transaction. If the app closes after the server commit but before local acknowledgement, the retry finds the receipt and does not repeat the write. Transient errors retry with backoff up to 60 seconds. Multiple tabs share IndexedDB transactions and receive change notifications; receipt checks also protect concurrent sync attempts.

### Conflict policy

- Ordinary edits/deletes compare the local document snapshot at the time the operation was saved on the device with the current server version. A mismatch stops that operation instead of silently overwriting another edit.
- Sales combine repeated lines for the same lot, validate the total quantity locally, then recheck current stock, product identity and cost inside the server transaction. Current stock counters are updated atomically. Concurrent sales cannot be accepted from the same stock snapshot if insufficient units remain.
- Purchases and all their lots are queued together. Purchase edits/deletes include the original lots as preconditions; newly sold stock causes a conflict, and server rules still apply.
- A failed operation pauses later operations because they may depend on it. The Sync center exposes saved details, safe retry and explicit discard. For a conflict, discard that operation and recreate the change from refreshed server data. Dependent changes may also need to be recreated.
- “Saved on this device” does not mean “Synced to server.” Local storage can still be removed by clearing browser data, OS/browser eviction, or explicit sign-out. Persistent-storage permission is requested after a save when supported.

### Authentication and cleanup

Access to local account data requires the matching restored Firebase session. Switching accounts resets observable state. Signing out clears that account’s IndexedDB cache and queue, notifies other tabs and reloads to clear Firestore memory/component state. The UI confirms before discarding unsynced changes or unsaved edits. Cached offline authorization cannot detect a server-side revocation until reconnection; the server rechecks permissions for every synchronization. Permission-denied collection reads remove the corresponding local cache.

### Existing backend restrictions

The supplied rules prohibit purchase updates/deletes and lot deletes. They also contain no allow rules for categories, models, types, vehicles, gallery or supplierPayments, and do not allow anonymous portfolio reads. These restrictions were not broadened. If those are also the deployed rules, the relevant features will display permission errors / failed synchronization. Deploying the receipt rules does not grant those missing permissions; an owner should review intended permissions separately before deployment.

## Installation and updates

The manifest supplies standalone display, theme colors, regular 192/512px icons, a maskable icon and an Apple touch icon. Supported browsers expose Install in the header/Sync center/login/portfolio; iOS users get Safari Add to Home Screen guidance.

Service worker installation is atomic: every listed asset must download before the new shell is accepted. Navigations use that version's cached index; external/backend responses are never cached. Prior static shell caches are retained so open older tabs can finish loading their matching lazy chunks. They contain no account data; browser site-data cleanup removes them.

Updates wait for an explicit Update & refresh action. Pending or failed saved changes must be resolved first. Unsaved inputs trigger a confirmation before refreshing; there is no automatic refresh on controller changes in another tab. Before leaving the page, modified inputs also enable the browser's unsaved-work warning. This is conservative input tracking, not automatic draft saving.

## Verification status

The subsequent audit ran the production build, existing tests, focused mocked offline regression checks, and read-only browser/mobile checks. It found three reproducible issues; see [AUDIT.md](AUDIT.md) for evidence and remaining gaps. No deployment or Firebase emulator checks were performed.

When verification is authorized, cover:

1. Production packaging, manifest icons, install flow, every lazy route, and offline reload after closing/reopening.
2. Every page at 320/375/768px and desktop, long names/amounts, keyboard navigation, drawers, dialogs with a mobile keyboard, and reduced motion.
3. Offline create/edit/delete, receipts and reports, reload with a pending queue, reconnect and duplicate-safe acknowledgement.
4. Two tabs/devices selling the same lot, repeated lot lines, competing edits, permission denial, transient network errors, storage-full and unavailable IndexedDB.
5. Sign-out with/without pending changes, cross-tab sign-out, account switching, permission revocation and absence of the prior user's data.
6. A second deployed version, update acceptance with unsaved input, updates in another tab and interrupted precaching.
