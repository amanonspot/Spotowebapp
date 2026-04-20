# Rentals API Map (Contract-First, Backend-Truthful)

## Runtime Baseline
- Real API mode: `NEXT_PUBLIC_RENTALS_MOCK_MODE=false`
- Demo mode: explicit opt-in only (`true`), isolated from real API behavior
- Base URL: `NEXT_PUBLIC_API_BASE_URL` (legacy fallback: `NEXT_PUBLIC_API_URL`)

## Shared Auth Dependency (outside Rentals domain inventory)
- `POST /api/login/`
- `POST /api/verify-otp/`
- Protected rentals endpoints use `Authorization: Bearer <access_token>`
- Public rentals endpoints are sent with `skipAuth=true`

---

## Tenant Flows

### Home Feed (`/`)
- Endpoint: `GET /api/rental/properties/`
- Auth: No
- Query params: none
- Request body: none
- Response fields consumed:
  - `id`, `title`
  - `rent`, `deposit`
  - `city_id`, `city_name`, `locality_id`, `locality_name`
  - `property_type_id/name/code`, `bhk_id/name`, `furnishing_id/name`, `availability_id/name`
  - `images[].image_url`, `images[].is_primary`, `images[].sort_order`
  - `amenities[]` or `amenity_ids[]`
  - `keywords[]` or `keyword_ids[]`
  - `is_verified`, `is_active`, `status` (if present)
- Loading / Error / Empty:
  - loading list placeholders
  - explicit API error state
  - explicit empty state
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Search (`/search`)
- Endpoint: `GET /api/rental/properties/`
- Auth: No
- Query params:
  - `city_id`
  - `locality_id`
  - `property_type_id`
  - `bhk_id`
  - `rent_min`
  - `rent_max`
  - repeatable `amenity_ids`
  - `keywords` as JSON-string array
- Request body: none
- Response fields consumed: same as home feed
- Loading / Error / Empty:
  - searching state
  - explicit API error
  - explicit no-results state
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Property Detail (`/booking/[slug]`)
- Endpoint: `GET /api/rental/properties/detail/?property_id=<uuid>`
- Auth: No
- Query params: `property_id`
- Request body: none
- Response fields consumed:
  - full property DTO + gallery + owner metadata
  - `description`, `amenities`, `keywords`
- Loading / Error / Empty:
  - loading state
  - explicit not-found/error state
  - empty gallery state if backend returns no images
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Unlock Contact (from detail page)
- Endpoint: `POST /api/rental/properties/get-contact/?property_id=<uuid>`
- Method: POST JSON
- Auth: Yes
- Query params: `property_id`
- Request body (optional): `{ name, phone, message }`
- Success response fields consumed:
  - `data.owner.name`, `data.owner.phone`
  - `data.documents[]`
  - `data.lead.*`
- Paywall response fields consumed:
  - `paywall.one_day`
  - `paywall.weekly`
- Loading / Error / Empty:
  - pending unlock state
  - success reveal state
  - paywall state for 402/paywall envelope
  - unauthorized / error state
- Mock replacement:
  - real mode: no synthetic success
  - demo mode: local fallback enabled

### Pass Activation (from unlock paywall)
- Endpoint: `POST /api/rental/passes/activate/`
- Method: POST multipart/form-data
- Auth: Yes
- Body:
  - `pass_type` (`one_day` | `weekly`)
  - optional `property_id`
- Response fields consumed:
  - `data.payment_id`
  - `data.razorpay_order_id`
  - `data.razorpay_key_id`
  - `data.amount`, `data.currency`, `data.pass_type`
- Loading / Error / Empty:
  - payment-init pending
  - init-failure state
  - checkout-launch state when Razorpay ids exist
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Tenant Contacts (`/contacts`)
- Backend endpoint: not defined in current rentals contract
- Current data source: successful unlock responses cached client-side
- Mock replacement:
  - real mode: backend-unlocked records only
  - demo mode: demo contacts allowed

---

## Owner Flows

### Owner Entry (`/owner`)
- Endpoint: `GET /api/rental/my/properties/`
- Auth: Yes
- Behavior:
  - empty list => `/owner/list-property`
  - one or more listings => `/owner/dashboard`
- Loading / Error:
  - loading route state
  - unauthorized redirects to login
  - explicit error fallback

### Owner Dashboard (`/owner/dashboard`)
- Endpoint: `GET /api/rental/my/properties/`
- Auth: Yes
- Response fields consumed:
  - all owner listings including unverified/inactive
  - status, price, location, image
- Loading / Error / Empty:
  - loading state
  - error state
  - empty-list state

### Owner Create (`/owner/list-property`)
- Endpoint: `POST /api/rental/my/properties/create/`
- Method: POST multipart/form-data
- Auth: Yes
- Body fields:
  - required: `title`, `property_type_id`, `city_id`, `rent`
  - optional: `employee_id`, `deposit`, `bhk_id`, `locality_id`, `address_line`, `built_up_area_sqft`, `furnishing_id`, `availability_id`, `description`, `contact_phone`
  - repeated: `amenity_ids`, `keyword_ids`, `image_files`
  - document pair: `document_type` + `document_file` together
- Response fields consumed:
  - `data.property_id`, `data.is_verified`, `message`
- Post-response behavior:
  - backend refetch via `GET /my/properties/`
- Loading / Error / Empty:
  - submit pending
  - backend validation errors
  - success route transition
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Owner Edit (`/owner/property/[id]/edit`)
- Prefill source: `GET /api/rental/my/properties/`
- Endpoint: `PATCH /api/rental/my/properties/update/?property_id=<uuid>`
- Method: PATCH multipart/form-data
- Auth: Yes
- Payload behavior:
  - changed fields only
  - supports `clear_images` + replacement `image_files`
  - supports `clear_documents` + `document_type` + `document_file`
  - supports explicit clears for nullable ids where intended
- Response fields consumed:
  - `data.property_id`, `message`
- Post-response behavior:
  - backend refetch via `GET /my/properties/`
- Loading / Error / Empty:
  - submit pending
  - no-change warning
  - backend validation errors
  - success route transition
- Mock replacement:
  - real mode: not used
  - demo mode: enabled

### Owner Contacts (`/owner/contacts`)
- Backend endpoint: not available in current rentals contract
- Current source: local unlocked lead state (integration placeholder)

---

## Admin Service Support (No new admin UI in this pass)
- `PATCH /api/rental/admin/properties/approve/?property_id=<uuid>`
- `PATCH /api/rental/admin/properties/reject/?property_id=<uuid>`

---

## Mapping Guarantees Implemented
- Canonical frontend field: `propertyTitle`
- Contract outbound field: `title`
- Inbound compatibility: supports `title` and `property_title`
- Canonical id flow: backend UUID for list/detail/edit/unlock
- Gallery ordering: `is_primary` then `sort_order`
- Tenant visibility enforcement in UI (real mode): hide non-verified/non-active listings

---

## Current Status
- Working:
  - list/detail/create/update/unlock/pass endpoints and methods
  - multipart vs JSON request shaping
  - strict no-silent-mock in real mode
- Partially wired:
  - owner contacts list still needs backend endpoint
- Needs backend clarification:
  - undocumented alternate response envelopes outside documented success/error/paywall patterns
