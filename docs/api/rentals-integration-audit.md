# Spoto Rentals Integration Audit (Frontend + API Contract)

## Concise Summary
- Overall status: **Partially working, now hardened for backend-truthful behavior in real mode**.
- Core integration layer was refactored to match contract paths/methods and remove silent real-mode mock masking.
- Remaining blockers are mostly backend-contract clarity (owner contacts endpoint, envelope consistency, and pass activation completion semantics).

## Working Correctly
1. Public masters fetch wiring and city->locality dependency.
2. Public list endpoint integration with contract query serializer.
3. Public detail endpoint now using `/api/rental/properties/detail/?property_id=...`.
4. Owner create endpoint and multipart payload mapping.
5. Owner update endpoint via `PATCH /api/rental/my/properties/update/?property_id=...` with changed-fields payload generation.
6. Owner dashboard source-of-truth from `GET /api/rental/my/properties/`.
7. Unlock contact API wiring with auth and paywall handling.
8. Pass activation request using multipart and backend Razorpay fields.
9. Real mode now avoids silent mock substitution.

## Partially Wired
1. Owner contacts page has no backend list endpoint in current rentals contract, so it still relies on local unlocked state.
2. Backend response field variance exists in live payloads; frontend normalizes aliases defensively, but canonical backend shape still needs standardization.

## Broken / High-Risk Before Fix (Now Addressed)
1. Property detail endpoint path mismatch in older code paths.
2. Real-mode fallback masking could fabricate valid-looking UI despite API failures.
3. Create/update success could return synthetic local records in real mode.
4. Public endpoints were attaching auth token opportunistically.
5. DTO field drift around amenities/keywords and title aliasing.

## Assumptions Requiring Backend Confirmation
1. Tenant visibility is strictly backend-authoritative via verification/active state.
2. 402 paywall payload shape for contact unlock is stable.
3. Pass activation completion remains webhook-based; frontend only handles payment initiation in this pass.
4. Owner contacts list endpoint is out of current contract scope.

## File-by-File Change List (this pass)
1. `/Users/aman/Spoto Front End Web/src/lib/rentals/wireTypes.ts`
- Added stricter DTO handling for `amenity_ids`/`keyword_ids` variants.

2. `/Users/aman/Spoto Front End Web/src/lib/api/client.ts`
- Added `skipAuth` support so public calls do not attach Bearer tokens.
- Preserved protected endpoint auth behavior.

3. `/Users/aman/Spoto Front End Web/src/lib/rentals/service.ts`
- Public endpoints call with `skipAuth`.
- Contract-true endpoint/method usage maintained.

4. `/Users/aman/Spoto Front End Web/src/lib/rentals/normalizers.ts`
- Improved keyword/amenity normalization for object/id-array variants.
- Preserved backend-first behavior with explicit real-mode strictness.

5. `/Users/aman/Spoto Front End Web/src/lib/adapters/ownerAdapter.ts`
- Strengthened create/update to avoid synthetic success records in real mode.
- Improved prefill/diff support for amenity/keyword variants.

6. `/Users/aman/Spoto Front End Web/src/lib/adapters/propertyAdapter.ts`
- Added strict guard for incomplete detail payload in real mode.

7. `/Users/aman/Spoto Front End Web/docs/api/rentals-api-map.md`
- Rewritten to match actual wiring and contract.

8. `/Users/aman/Spoto Front End Web/docs/api/rentals-api-issues.md`
- Rewritten into strict issue taxonomy and backend clarifications.

## Manual QA Checklist
1. Masters bootstrap:
- cities load
- localities reload by selected `city_id`

2. Tenant listing/search:
- filter query params match contract (`amenity_ids` repeat, `keywords` JSON-string)
- no fake cards shown on API error in real mode

3. Tenant detail:
- detail call uses `/properties/detail`
- gallery order follows primary/sort metadata

4. Owner create:
- multipart payload contains exact mapped fields
- document pair validation enforced
- success refetches dashboard backend data

5. Owner edit:
- prefill from owner endpoint data
- changed-only PATCH payload
- post-save dashboard shows updated backend values

6. Unlock flow:
- auth required behavior
- success reveals backend contact
- paywall state from backend response/402

7. Pass activation:
- backend response provides Razorpay order/key
- checkout opens from backend fields only

8. Real-mode isolation:
- no silent mock fallback when API fails

## Confidence Rating by Major Flow
- Public listing: **High**
- Public detail: **High**
- Owner create: **Medium-High** (needs live mutation verification in target env)
- Owner edit: **Medium-High** (needs live changed-field matrix verification)
- Owner dashboard: **High**
- Tenant unlock contact: **High**
- Pass activation init: **Medium-High** (final activation is webhook/backend)
- Admin approve/reject service calls: **Medium** (service layer ready, no UI exercised in this pass)
