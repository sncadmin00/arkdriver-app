# ARK Driver — open items

## Blocked by Apple (membership migrating to organization)
- [ ] **Document scanner instead of plain camera** — `react-native-document-scanner-plugin`.
      Drivers photograph PODs badly (dark, angled, unreadable) → delays factoring payment.
      Native module, needs a development build. Only `capture()` in `app/load/upload.tsx` changes;
      upload logic and payload stay identical (still JPEG).
- [ ] EAS builds / TestFlight

## Ready to build
- [ ] Chat with dispatcher (endpoints live)
- [ ] Compliance tab
- [ ] Accounting tab
- [ ] Push notifications
- [ ] More tab (profile, announcements, SOS)

## Done
- Auth, Home, Loads list
- Load detail: stops, instructions, customer contact
- Per-stop check-in (arrived/departed) with doc gates
- `podRequired` — self-bill loads close without POD
- Document upload with `stopIndex`
- TMS-side: merged PDF packet for factoring
