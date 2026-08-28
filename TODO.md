# ARK Driver — open items

## Blocked by Apple (membership migrating to organization)
- [ ] Document scanner instead of plain camera — `react-native-document-scanner-plugin`.
      Drivers photograph PODs badly → delays factoring payment. Native module, needs a
      dev build. Only `capture()` in `app/load/upload.tsx` changes; payload stays JPEG.
- [ ] Push notifications — backend ready (`push-tokens`), needs dev build.
- [ ] Background GPS during active loads.
- [ ] EAS builds / TestFlight / App Store.

## Waiting on backend
- [ ] Maintenance alerts — oil change / inspection due by mileage. Truck data exists
      in the TMS, no driver endpoint yet.

## Waiting on Rusty
- [ ] Telegram bots must accept the `/start` payload code and call
      `POST /api/public/driver-services/link` with `x-bot-secret`. Then the Services
      surface can ship (per-driver `subscribed` state already live in `/services`).
- [ ] PTI bonus is decided office-side but the app says nothing about it. Drivers
      won't be motivated by an incentive they don't know exists.

## Not verified with real data
- [ ] Fuel / toll sections on Pay — written, never rendered with a real import.
      Transaction wrapper key is a guess (`transactions` / `items`).
- [ ] Per-load pay on load detail — only shows when `reference` matches a settlement week.
- [ ] Direct deposit page — link now points at production payroll.
- [ ] 1099 list — empty until an accountant files a form.

## Deliberately not built
- Accept / Decline load — loads are dispatched, dispatcher pulls them back if needed.
- In-app e-signature for the annual review packet — the signed web link already
  produces the legally correct PDF.
- Second app for drivers at other companies — Homefood already works in Telegram;
  build the product when there's demand, not before.

## The real next step
- [ ] **One live load with a real driver.** Everything below was built against
      contracts and tested with `d1135`. No actual driver has opened this app.
      Possible today over Expo Go.

## Done
- Auth, Home, Loads list + history
- Load detail: stops, instructions, customer contact, per-load pay
- Per-stop check-in (arrived/departed) with document gates
- `podRequired` — self-bill loads close without POD
- Document upload with `stopIndex`; TMS builds the merged PDF packet for factoring
- Trip map: road route polyline, stop markers, whole-trip / next-stop toggle
- Navigation launcher with truck-app priority and store fallbacks
- Chat: realtime, optimistic send, load tagging
- Compliance: DQ slots, truck folder, in-app viewer, share (truck docs only)
- More: profile, duty toggle, SOS, services, announcements
- Pay: weekly settlement, RPM, deductions, bonuses, debts, YTD, 1099 viewer,
  payment history, deduction dispute, direct deposit link
- Personal expense tracker (on-device, CSV export)
- Pre-trip inspection: checklist, defect photos, evidence hash, history
- Incident reports: accident / DOT inspection / citation, offline queue
- EN / RU / UZ with server-side `Accept-Language`
