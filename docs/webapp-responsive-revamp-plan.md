# Webapp Responsive Revamp Plan

## Goal
Deliver a frontend-first, responsive Next.js webapp aligned with the latest SPOTO UX direction, while backend API integration remains deferred.

## Decisions Locked
- Branch isolation: `codex/webapp-responsive-revamp`
- Backend integration: deferred
- Data mode: typed local fixtures with adapter abstraction
- Auth mode: UI-complete mocked OTP + guest access
- Checkout mode: prototype unlock/payment state transitions

## Implementation Checklist
- [x] Create isolated branch
- [x] Add dedicated implementation plan doc
- [x] Add typed `src/mocks` fixtures
- [x] Add typed `src/lib/adapters` layer
- [x] Add mock auth/session hook
- [x] Replace home/search/detail routes with fixture-driven responsive UI
- [x] Wire auth pages to mocked OTP flow
- [x] Add conversion surfaces (owner lock, unlock card, sticky pay CTA)
- [ ] Validate responsive layouts at 360/390/768/1024/1280
- [ ] Run lint/build checks (environment permitting)

## Notes
- Existing backend services are intentionally left untouched.
- UI and data flow are structured so adapters can be swapped to API implementations later with minimal page changes.
- `AuthGuard` now allows guest browsing for frontend-first UX validation.
