# ARK Driver — open items

## Blocked by Apple (membership migrating to organization)
- [ ] **Document scanner instead of plain camera** — `react-native-document-scanner-plugin`.
      Drivers photograph PODs badly (dark, angled, unreadable) → delays factoring payment.
      Native module, needs a development build. Only `capture()` in `app/load/upload.tsx` changes;
      upload logic and payload stay identical (still JPEG).
- [ ] EAS builds / TestFlight

## Ready to build
- [ ] Compliance tab
- [ ] Accounting tab

## Blocked / waiting
- Push notifications — backend ready, needs dev build (Apple)
- Compliance tab — no endpoints yet
- Accounting tab — bonus API still being built

## Done
- Auth, Home, Loads list
- Load detail: stops, instructions, customer contact
- Per-stop check-in (arrived/departed) with doc gates
- `podRequired` — self-bill loads close without POD
- Document upload with `stopIndex`
- TMS-side: merged PDF packet for factoring
- Chat: realtime, optimistic send, load tagging
- More: profile, duty toggle, SOS, services, announcements

## Telegram services (backend ready, app deferred)
- Per-driver `subscribed` state + self-linking `connectDeepLink` are live in `/services`.
- Still needed on the bot side: accept the `/start` payload code and call
  `POST /api/public/driver-services/link` with `x-bot-secret`.
- App work once bots are updated: Services surface (tab placement TBD — 6 tabs vs
  folding More into Compliance) + a card on Home under the active load.

## Verify when real data lands
- Fuel / toll sections on the Pay screen are written but never rendered with real
  data — no statement has been imported yet. The transaction wrapper key is a
  guess (`transactions` / `items`); confirm against the first real import.
- Per-load pay on the load detail screen only shows when the load's `reference`
  matches a settlement week. Untested with a matching load.

## Dropped from spec (decided, not deferred)
- **Accept / Decline load** — not needed. Loads are dispatched to a driver and
  that's it. If there's a problem the dispatcher pulls the load back in the TMS.
  No Available Loads tab.

## Missing from the app (not in Lovable's audit)
- Load history screen — `?scope=history` is live, no UI. d1135 has 4 finished loads.
- Navigation button — `/navigation` endpoint exists (Trucker Path priority), never wired up.
- Localisation RU/UZ — every string is English today.
- Background GPS during active loads.
