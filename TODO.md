# ARK Driver — open items

## Blocked by Apple (membership migrating to organization)
- [ ] **Document scanner instead of plain camera** — `react-native-document-scanner-plugin`.
      Drivers photograph PODs badly (dark, angled, unreadable) → delays factoring payment.
      Native module, needs a development build. Only `capture()` in `app/load/upload.tsx`
      changes; upload logic and payload stay identical (still JPEG).
- [ ] Push notifications — backend ready (`push-tokens`), needs a dev build.
- [ ] Background GPS during active loads.
- [ ] EAS builds / TestFlight / App Store.

## Waiting on backend
- [ ] Maintenance alerts — oil change / inspection due by mileage. Truck data exists
      in the TMS, no driver endpoint yet.

## Waiting on Rusty
- [ ] Telegram bots must accept the `/start` payload code and call
      `POST /api/public/driver-services/link` with `x-bot-secret`. Then the Services
      surface can ship — per-driver `subscribed` state is already live in `/services`.
- [ ] PTI bonus is decided office-side but the app says nothing about it. Drivers
      won't be motivated by an incentive they don't know exists.
- [ ] Billed miles vs HERE: L-1013 is 761 billed against 734 routed. Worth checking
      once which is right — it's ~27 miles of pay per load either way.

## Not verified with real data
- [ ] Fuel / toll sections on Pay — written, never rendered with a real import.
      Transaction wrapper key is a guess (`transactions` / `items`).
- [ ] Per-load pay on load detail — only shows when `reference` matches a settlement week.
- [ ] Direct deposit page — the link points at production payroll.
- [ ] 1099 list — empty until an accountant files a form.

## Deliberately not built
- **Turn-by-turn guidance in the app** — requires the HERE Navigate SDK under a
  separate commercial licence, plus weeks of work, to land behind Trucker Path.
  ARK Truck Map is a planning tool: route, mileage, tolls, restriction warnings.
  Driving is handed off to a truck navigator.
- **Passing our route to Google Maps** — their deep link accepts a destination only,
  not a route. Google would re-route for a car regardless.
- Accept / Decline load — loads are dispatched; the dispatcher pulls them back if needed.
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
- Load detail: stops, instructions, customer contact, per-load pay, toll estimate
- Per-stop check-in (arrived/departed) with document gates
- `podRequired` — self-bill loads close without a POD
- Document upload with `stopIndex`; TMS builds the merged PDF packet for factoring
- Trip map: HERE truck routing, road polyline, stop markers, whole-trip / next-stop
- Route comparison: fastest / fewest tolls / cheapest, with tolls and fuel
- Truck map: free address search, saved places, bobtail vs trailer, HERE autosuggest
- Navigation handoff: Trucker Path and Hammer as truck apps; Google/Apple/Waze
  behind a car-routing warning
- Chat: realtime, optimistic send, load tagging
- Compliance: DQ slots, truck folder, in-app viewer, share (truck docs only)
- More: profile, duty toggle, SOS, services, announcements
- Pay: weekly settlement, RPM, deductions, bonuses, debts, YTD, 1099 viewer,
  payment history, deduction dispute, direct deposit link
- Personal expense tracker (on-device, CSV export)
- Pre-trip inspection: checklist, defect photos, evidence hash, history
- Incident reports: accident / DOT inspection / citation, offline queue
- EN / RU / UZ with server-side `Accept-Language`
