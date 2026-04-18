# Rentals API Integration Issues and Clarifications

## Malformed or inconsistent endpoints in collection
1. `DELETE api/rental/masters/property-types/delete/`
- Missing `{{baseUrl}}` prefix and leading slash.
- Cannot be consumed as-is in frontend tooling.

2. `DELETE /api/rental/masters/bhk-types/delete/?bhk_id`
- Uses root-relative URL while other requests use `{{baseUrl}}/...`.
- Needs consistent canonical URL from backend.

3. `GET /api/rental/masters/keywords/` includes raw OTP-like request body in collection sample
- GET with unrelated raw body payload likely a Postman artifact.
- Frontend ignores body for this GET call.

## Localhost-hardcoded endpoints
1. Non-rentals legacy example present in collection:
- `http://127.0.0.1:8000/api/event/listing...`
- Not used for Rentals integration and should not be used in production frontend.

## Missing / conflicting env dependencies
1. Codebase currently has mixed usage:
- `NEXT_PUBLIC_API_BASE_URL` (new preferred)
- `NEXT_PUBLIC_API_URL` (legacy)
- hardcoded production URL fallback in existing client/config.

2. Action taken in integration:
- Prefer `NEXT_PUBLIC_API_BASE_URL`.
- Keep `NEXT_PUBLIC_API_URL` as backward-compatible fallback.
- Keep production URL fallback only as final safety.

## Ambiguous request/response contracts (needs backend confirmation)
1. `POST /api/rental/properties/get-contact/?property_id=...`
- Exact success payload shape unclear (owner contact object vs message wrapper).
- Error payload for “credits exhausted/pass required” is not documented.

2. `POST /api/rental/passes/activate/`
- Response shape for order/session/redirect not documented in collection examples.
- Frontend keeps adapter-level provisional mapping and resilient fallback.

3. `GET /api/rental/properties/` and `GET ...?property_id=...`
- No saved examples for list/detail shape.
- Potential field-name variance (`id` vs `property_id`, nested city/locality/media forms).
- Frontend uses normalizers with defensive fallback fields.

4. `GET /api/rental/my/properties/`
- Listing status fields and media/document arrays are not documented in examples.
- Dashboard/edit flow relies on provisional wire types + normalizers.

5. `POST /api/rental/my/properties/create/` vs `POST /api/rental/my/properties/?property_id=...`
- Update endpoint is POST + query id (not PATCH/PUT), confirmed from collection structure.
- Need backend confirmation on which fields are required for partial update and file replacement semantics.

## Endpoints requiring backend clarification before full UI replacement
1. Contact unlock and credit accounting source of truth
- Need backend contract for free-credit count, deduction event, and unlock entitlement state.
- Current frontend keeps a deterministic local fallback ledger in mock/failure path.

2. Owner contacts list endpoint
- No dedicated endpoint in Rentals collection to fetch all unlocked tenant contacts for owner.
- Current owner contacts view is derived from local unlock state (integration-ready placeholder).

3. Master list response schemas
- City/locality/property-type/bhk/furnishing/availability/amenity/keyword object keys not documented.
- Normalizers currently support common key variants and fallback to mock labels.

## Integration assumptions (explicit)
1. Login/User APIs are treated as shared dependencies, not Rentals inventory.
2. Missing response examples are handled with provisional wire types + adapter normalization.
3. UI remains functional even when backend response shape differs; errors are surfaced and fallbacks retained.

