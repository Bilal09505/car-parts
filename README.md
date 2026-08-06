# Car Body Parts Inventory — Angular 21 + Tailwind v4 + Firebase

This is a full working Angular CLI project — `angular.json`, `tsconfig*.json`, everything.
Verified with `ng build` before packaging (see build output below).

## 1. Install

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is needed because `@angular/fire`'s published peer-dep range hasn't
caught up to Angular 21 yet — it still works fine, npm is just being cautious.

## 2. Connect Firebase

Create a project at https://console.firebase.google.com, enable **Firestore** and
**Authentication**. Copy your web app config into `src/environments/environment.ts`
(replace the placeholder values).

## 3. Deploy security rules + index

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point it at firestore.rules / firestore.indexes.json in this repo
firebase deploy --only firestore:rules,firestore:indexes
```

The composite index in `firestore.indexes.json` is **required** — the Sales screen's lot
picker query (`where productId ==` + `where quantityRemaining >` + `orderBy`) will throw
a "requires an index" error without it. Firestore will also print a direct link to
create it the first time the query runs, if you'd rather do it that way.

## 4. Run

```bash
npm start
```

## What's built

| Module | Status |
|---|---|
| Dashboard | Live stat cards via Firestore aggregation queries |
| Products / Suppliers / Customers | List + add (no edit/delete yet) |
| Purchase | Multi-line invoice — each line creates its own Lot |
| Sales | **Manual lot picker** — shows remaining qty + cost per lot, atomic Firestore transaction on submit |
| Lot Management | Doubles as your lot-wise profit report — totals are denormalized onto the lot doc at sale time, no aggregation query needed to display it |
| Reports | Stock Report, Low Stock Report |
| Users / roles | **Not built** |

## What you still need to do

- **Edit/delete flows** — only add is wired for Products/Suppliers/Customers.
- **Invoice PDF printing** — not built.
- **Auth guard on routes** — nothing stops an unauthenticated user reaching every screen
  right now. Add a `CanActivate` guard on the shell route once login is wired up.
- **Barcode/QR** — mentioned in the client deck as "future support," not started.
- **Concurrency testing** — two staff selling from the same lot at the same second is
  exactly what the `runTransaction` in `sale.service.ts` is for. Test it for real, don't
  just trust the code.
