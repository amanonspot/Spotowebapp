# Rentals API Map (Updated to `FRONTEND_INTEGRATION_CONTRACT.md`)

## Runtime Baseline
- Real mode: `NEXT_PUBLIC_RENTALS_MOCK_MODE=false` (no silent mock fallback)
- API base: `NEXT_PUBLIC_API_BASE_URL`
- Protected calls: `Authorization: Bearer <access_token>`
- Public calls: `skipAuth=true`

## Contract Decisions Locked
1. Canonical property title field: `property_title`
2. Canonical keywords write/read: `keywords` (free-text array)
3. Canonical detail endpoint: `GET /api/rental/properties/?property_id=<uuid>`
4. Availability supports both: `availability_id` and `available_from`
5. Error envelope supports: `success:false`, `error`, optional `field_errors`
6. Unlock paywall shape uses `error` + `data.one_day|weekly`
7. Localities API must receive `city_id`
8. Owner update endpoint: `PATCH /api/rental/my/properties/update/?property_id=<uuid>` multipart

## Shared Auth Dependency (outside rentals module inventory)
- `POST /api/login/`
- `POST /api/verify-otp/`
- Canonical tokens from body: `access`, `refresh`

## Tenant Flows

### Home (`/`)
- Endpoint: `GET /api/rental/properties/`
- Auth: no
- Query: none
- Reads: `id`, `property_title`, `rent`, `deposit`, `city/locality ids+names`, type/BHK/furnishing/availability, `images[]`, `amenities`, `keywords`, `is_verified`, `is_active`
- State: loading/error/empty handled explicitly
- Mock replacement: only when mock mode is true

### Search (`/search`)
- Endpoint: `GET /api/rental/properties/`
- Auth: no
- Query supported:
  - `city_id`, `locality_id`, `property_type_id`, `bhk_id`
  - `rent_min`, `rent_max`
  - `amenity_ids` (JSON-string array per Postman examples)
  - `keywords` (JSON-string array)
  - optional geosearch: `lat`, `lng`, `radius_km`
- State: loading/error/empty handled explicitly

### Detail (`/booking/[slug]`)
- Endpoint: `GET /api/rental/properties/?property_id=<uuid>`
- Auth: no
- Reads:
  - `property_title`, content fields, images gallery (`is_primary`, `sort_order`), owner/contact metadata, docs, map fields, availability/date
- State: explicit not-found/incomplete/unavailable handling

### Unlock Contact
- Endpoint: `POST /api/rental/properties/get-contact/?property_id=<uuid>`
- Auth: yes
- Body: optional `{ name, phone, message }`
- Success reads: `data.owner`, `data.lead`, `data.documents`
- Paywall reads: `error` + `data.one_day`, `data.weekly`

### Pass Activate
- Endpoint: `POST /api/rental/passes/activate/`
- Auth: yes
- Content-Type: multipart/form-data
- Body: `pass_type`, optional `property_id`
- Success reads: `data.razorpay_order_id`, `data.razorpay_key_id`, `data.amount`, `data.currency`, `data.pass_type`

## Owner Flows

### Owner Entry (`/owner`)
- Current behavior: dashboard-first (`/owner/dashboard`)
- Dashboard shows empty-state CTA when listing set is empty

### Owner Dashboard (`/owner/dashboard`)
- Endpoint: `GET /api/rental/my/properties/`
- Auth: yes
- Reads all owner properties, including unverified
- Reads owner documents returned in payload

### Owner Create (`/owner/list-property`)
- Endpoint: `POST /api/rental/my/properties/create/`
- Auth: yes
- Content-Type: multipart/form-data
- Writes:
  - `property_title`, `property_type_id`, `city_id`, `rent`
  - plus optional: `employee_id`, `deposit`, `bhk_id`, `locality_id`, `address_line`, `built_up_area_sqft`, `furnishing_id`, `availability_id`, `available_from`, `description`, `contact_phone`, `map_url`, `latitude`, `longitude`
  - `amenity_ids` (JSON-string array)
  - `keywords` (JSON-string array of free text)
  - `images` multi-file
  - `document_type` + `document_file` (paired)
- Reads response: `property_id`, `is_verified`, optional `document`

### Owner Edit (`/owner/property/[id]/edit`)
- Prefill source: owner properties endpoint
- Endpoint: `PATCH /api/rental/my/properties/update/?property_id=<uuid>`
- Auth: yes
- Content-Type: multipart/form-data
- Behavior:
  - changed-fields-only payload
  - supports `clear_images`, `clear_documents`
  - document pair enforced when replacing

## Admin Service Support (service-layer only)
- `PATCH /api/rental/admin/properties/approve/?property_id=<uuid>`
- `PATCH /api/rental/admin/properties/reject/?property_id=<uuid>`

## Notes on Status Mapping
1. Raw backend statuses are preserved in model mapping.
2. Frontend UX intentionally renders `verifying` and `verification_retry` with one shared pending/retry experience.
