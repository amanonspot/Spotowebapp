# Rentals API Issues (Contract-Locked Audit)

## 1. Contract Conflicts

No unresolved contract conflicts remain in frontend integration after this pass.

## 2. Backend/Ops/Data-seeding dependencies (not frontend-fixable)

### A) Masters completeness
- If only one city/locality/property type/BHK appears, this is a seed-data issue.
- Frontend now correctly renders what backend returns and does not hardcode fake options.

### B) OTP delivery reliability
- API flow is integrated; actual SMS delivery still depends on provider/ops setup.
- Frontend now surfaces structured field-level OTP errors.

### C) Owner role and listing population
- `is_owner` now exists in backend response shape, but product behavior still depends on actual user/listing data in backend.

## 3. Strict frontend integration risks (now fixed)
1. Legacy `title` contract drift in owner create/update payload.
2. Legacy keyword UUID assumptions (`keyword_ids`, keyword masters).
3. Detail route using deprecated `/properties/detail/`.
4. Missing `available_from` parity in create/edit/display.
5. Inconsistent error parsing when backend returns `success:false` + `field_errors`.
6. Paywall parsing expecting deprecated `paywall` root key.
7. Localities API calls without `city_id`.
8. Document metadata not surfaced after create/update/edit.

## 4. Remaining frontend product improvements (non-blocking for API correctness)
1. Owner dashboard UI parity with mobile reference visuals.
2. Stronger skeleton/loading states for owner edit prefill and public detail.
3. Explicit inline field binding for all backend `field_errors` keys on owner wizard.
4. Geo proximity filter controls (`lat/lng/radius_km`) exposure in tenant search UI.

## 5. Locked business rules reflected in frontend
1. Tenant visibility: only live/verified listings are public.
2. Create without employee code: listing starts in `in_review`.
3. Rejected recovery: owner must edit and resubmit.
4. UI normalization: `verifying` and `verification_retry` share one pending/retry UX state.
