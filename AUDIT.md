# Verification audit — 3 October 2026

This audit checks the current working tree. No production business records were created, edited or deleted, and no Firebase rules were deployed. Application behavior has not been fixed in this audit.

## Confirmed issues

### P1 — An old edit form can overwrite another user's newer change

`src/app/core/services/offline-data.service.ts:204–208` reads the latest local record when Save is clicked, then uses that record as the conflict precondition. Existing edit forms retain older copied field values (`products.component.ts:367–379`). If a server update arrives while a form is open, the precondition is refreshed but the form is not. The transaction therefore accepts the stale form.

Reproduced with the real service methods and mocked backend I/O: open a product at Rs 100, receive another user's change to Rs 150, then save a name edit from the original form. The stored price becomes Rs 100 without reporting a conflict. Capture the document version when editing begins, or explicitly merge only fields changed by that editor.

### P1 — Storage failure can prevent sign-out

`src/app/core/services/auth.service.ts:29–30` awaits device cleanup before Firebase sign-out. `offline-data.service.ts:344` propagates IndexedDB failures. When browser storage is unavailable, the cleanup rejects and Firebase sign-out is never reached, leaving the session authenticated. The offline service has already cleared its UI state and set `stopping`, so normal use can also be disabled until a reload.

Reproduced by making IndexedDB opening throw. Authentication revocation should not depend on successful local database cleanup; cleanup failures need a separate, explicit handling path.

### P2 — Pending sales can display too much available stock

`src/app/core/services/offline-data.service.ts:158` overlays the absolute lot values saved with each queued operation, rather than applying the pending quantity to the current server stock.

Reproduced: stock was 10; this device queues a sale of 3, so its stored projection is 7. Another device sells 4, leaving server stock at 6. This device still displays 7, although the correct remaining quantity after its pending sale is 3. Subsequent local sales can be accepted against overstated availability and fail during sync. Server transaction stock validation still prevents the actual server quantity from going negative. Rebase projections against current server snapshots, while accounting for operations already acknowledged by the server.

## Checks completed

- Production build: passed, including the PWA packaging step (39 precached local assets).
- Existing Angular test suite: all six monthly profit/loss tests passed.
- Added isolated regression harness: `node scripts/audit-offline.cjs`. It uses the actual TypeScript service methods with mocked I/O: three failing cases above and one passing duplicate-retry case. It intentionally exits with a failure status until the bugs are addressed.
- Retrying an already committed operation found the existing receipt and did not duplicate the record in the mocked backend.
- Browser: authenticated workspace navigation across all nine routes at a 320 × 640 viewport showed no horizontal page overflow or visible runtime errors. An existing purchase receipt rendered inside its scrollable dialog, and monthly reporting rendered successfully.
- PWA shell: the Sync center reported the app available offline; after the local HTTP server was stopped, the Reports page reloaded and rendered. This validates cached shell loading, not complete network disconnection: Firebase was still reachable.
- Browser checks were read-only apart from navigation and view controls. The existing browser session was used; the audit did not enter credentials or change live business records.

## Other findings and release cautions

- The initial production bundle is 904.09 kB raw / approximately 235.86 kB estimated transfer. This exceeds the configured 500 kB warning budget but remains below the 1 MB build failure limit.
- Two supplier templates produce unnecessary optional-chain warnings for `purchase.items?.length`.
- The repository's Firestore rules deny lookup collections, gallery, supplier payments and anonymous portfolio access, and explicitly prohibit purchase updates/deletes and lot deletes. The authenticated browser did load lookup data, so the deployed permissions evidently differ from this file. Do not deploy the repository rules unchanged without reconciling the intended permissions. The new private receipt rules are also required for synchronization.
- Unsaved-work tracking is event-based and is never cleared after a normal successful save. It can continue warning after work was saved, and custom controls that change models without native input/change events are not comprehensively tracked. This is a source-review finding, not a reproduced browser update test.
- Service worker activation retains every previous shell cache. Without eventual cleanup, repeated releases accumulate browser storage. This is a source-review finding; quota exhaustion was not simulated.

## Still unverified

Real offline business writes and reconnect synchronization, browser-close/reopen persistence, live multi-device transaction conflicts, permission revocation, sign-out cleanup across real tabs, actual storage quotas, iOS installation, physical mobile-keyboard behavior, and the complete two-version update flow need a dedicated test account or Firebase emulator. The audit did not intentionally alter or disconnect the user's live environment to perform those checks.

The optional local preview can be restarted with `node scripts/audit-serve.cjs`; it serves the production build on `http://127.0.0.1:4173`.
