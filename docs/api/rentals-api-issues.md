# Rentals API Issues (Frontend Audit)

## 1) Malformed Endpoints in Collection Samples
1. `DELETE api/rental/masters/property-types/delete/`
- Missing base-url variable and leading slash.
- Not consumable as-is by frontend tooling.

2. `DELETE /api/rental/masters/bhk-types/delete/?bhk_id`
- Inconsistent formatting vs other collection entries using full base path pattern.
- Needs one canonical style from backend docs/collection.

## 2) Localhost-Hardcoded Endpoints
1. Legacy non-rentals sample detected in collection:
- `http://127.0.0.1:8000/api/event/...`
- Not used by rentals integration and must not be used in deploy config.

## 3) Missing / Inconsistent Env Dependencies
1. Multiple frontend env keys exist:
- `NEXT_PUBLIC_API_BASE_URL` (preferred)
- `NEXT_PUBLIC_API_URL` (legacy fallback)

2. Required deploy action:
- Ensure Netlify/production defines `NEXT_PUBLIC_API_BASE_URL`.
- Keep legacy fallback only for backward compatibility during migration.

## 4) Ambiguous Request / Response Fields
1. `POST /api/rental/properties/get-contact/?property_id=...`
- Exact error envelope shape on exhausted free unlocks varies by server path (`402` + body vs success:false paywall envelope).
- Frontend now handles both patterns, but backend should standardize one contract.

2. `POST /api/rental/passes/activate/`
- Contract-critical fields (`razorpay_order_id`, `razorpay_key_id`, `amount`, `currency`) must always be present for checkout.
- Any optional/nullable behavior should be explicitly documented.

3. `GET /api/rental/properties/` and `GET /api/rental/properties/detail/`
- Field aliases can vary (`title` vs `property_title`, `amenities[]` vs `amenity_ids[]`, `keywords[]` vs `keyword_ids[]`).
- Frontend normalizes variants, but backend should provide one canonical shape.

4. Owner property list payload shape
- Some records may omit display-friendly labels while returning ids only.
- Frontend resolves using masters, but backend docs should define which display fields are guaranteed.

## 5) Endpoints Requiring Backend Clarification
1. Owner contacts listing endpoint
- No rentals endpoint currently returns all unlocked tenant contacts for owner dashboard/contacts.
- Frontend currently uses local unlock state for owner contacts UI only.

2. Approval visibility semantics
- Tenant visibility appears tied to verification + active status.
- Backend should confirm final tenant-list inclusion rules explicitly for newly created owner listings.

3. Payment activation lifecycle
- Webhook-based final pass activation is backend-authoritative.
- Backend should document a polling/status endpoint contract if frontend must reflect completion state.

## 6) Frontend-Detected Integration Risks (Now Mitigated in Code)
1. Silent API→mock masking in real mode.
- Fixed: real mode now throws explicit errors, mock fallback only in demo mode.

2. Synthetic create/update success summaries in real mode.
- Fixed: create/update now require backend truth/refetch confirmation.

3. Inconsistent auth application on public endpoints.
- Fixed: public rentals endpoints use `skipAuth`; protected endpoints use Bearer token.

## 7) Backend Issues for Backend Team
1. Standardize one response envelope per endpoint family:
- success: `{ success: true, data: ... }`
- failure: `{ error: \"...\" }` or documented structured equivalent

2. Confirm and lock canonical field names:
- title field (`title` only vs dual support with `property_title`)
- amenities/keywords representation consistency

3. Provide owner-contacts endpoint if owner contacts should be backend-source-of-truth.

4. Document hard validation behavior for:
- `document_type` + `document_file` pairing
- `clear_images` / `clear_documents` update semantics
- update partial field clearing behavior (e.g., empty string vs null)
