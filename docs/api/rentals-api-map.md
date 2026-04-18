# Rentals API Map (Tenant + Owner)

## Scope and Baseline
- **Frontend baseline kept:** existing tenant routes remain primary UI baseline.
- **Owner module added under:** `/owner`, `/owner/list-property`, `/owner/dashboard`, `/owner/property/[id]/edit`.
- **Shared dependencies (out of Rentals inventory):**
1. Login API
2. User API

## Environment
- `NEXT_PUBLIC_API_BASE_URL` (primary)
- `NEXT_PUBLIC_API_URL` (legacy fallback)

## Contract Notes
- Postman collection has Rentals endpoints but **no saved response examples**.
- Integration uses provisional wire types + normalizers and defensive fallbacks.
- Mock data remains active only where backend shape/endpoint is missing or ambiguous.

## Create vs Update (Owner) Behavior (explicit verification)
- **Create property:** `POST /api/rental/my/properties/create/` with multipart form-data (full listing payload).
- **Update property:** `POST /api/rental/my/properties/?property_id={id}` with multipart form-data (partial/update-style payload supported by backend contract sample, including `clear_images`, `clear_documents`).
- Update is not `PATCH/PUT` in current collection; frontend must call the **POST + property_id query** endpoint for edits.

---

## Tenant Flows

### 1) Login (shared dependency)
- **Screen:** `/auth/login`
- **Endpoint:** `/api/login/`
- **Method:** `POST`
- **Auth:** No
- **Body:** `phone`
- **Query:** none
- **Expected response fields:** `message`, optional identifiers
- **Loading/Error/Empty:** loading spinner on send, inline OTP-send error
- **Mock replacement:** **Yes** (replaced where reachable; fallback remains)

### 2) OTP verify (shared dependency)
- **Screen:** `/auth/login` OTP state + `/auth/otp`
- **Endpoint:** `/api/verify-otp/`
- **Method:** `POST`
- **Auth:** No
- **Body:** `phone`, `otp`
- **Query:** none
- **Expected response fields:** `access`, `refresh`, `user_id`, `message`
- **Loading/Error/Empty:** verify loading, invalid OTP inline error
- **Mock replacement:** **Yes** (fallback `0000` in mock mode)

### 3) Home feed (rentals cards)
- **Screen:** `/`
- **Endpoint(s):**
1. `/api/rental/properties/`
2. `/api/rental/masters/localities/` (optional enrichment)
- **Method:** `GET`
- **Auth:** No (listing endpoint appears public)
- **Body:** none
- **Query:** optional filters unsupported on home by default
- **Expected response fields (normalized):**
1. `id/property_id`
2. `title`
3. `rent`
4. `deposit`
5. `city/locality`
6. `image/display_image/images[]`
- **Loading/Error/Empty:** skeleton/loading card, error banner, empty-state card
- **Mock replacement:** **Partial now** (API first, mock fallback)

### 4) Search + filter
- **Screen:** `/search`
- **Endpoint:** `/api/rental/properties/`
- **Method:** `GET`
- **Auth:** No
- **Body:** none
- **Query params (mapped):**
1. `city_id`
2. `locality_id`
3. `property_type_id`
4. `bhk_id`
5. `rent_min`
6. `rent_max`
7. `amenity_ids`
8. `keywords`
- **Expected response fields:** rental list records (normalized to `PropertyListItem`)
- **Loading/Error/Empty:** searching state, retry on error, empty result message
- **Mock replacement:** **Partial now** (API first, mock fallback)

### 5) Property detail
- **Screen:** `/booking/[slug]`
- **Endpoint:** `/api/rental/properties/?property_id={id}`
- **Method:** `GET`
- **Auth:** No (assumed public)
- **Body:** none
- **Query:** `property_id`
- **Expected response fields (normalized):**
1. list-card fields
2. `description`
3. amenities/highlights
4. owner contact metadata (masked/visible depending on unlock)
- **Loading/Error/Empty:** loading shell, error block, not-found fallback
- **Mock replacement:** **Partial now** (API first, mock fallback)

### 6) Unlock direct contact
- **Screen:** `/booking/[slug]` unlock/paywall card
- **Endpoint:** `/api/rental/properties/get-contact/?property_id={id}`
- **Method:** `POST`
- **Auth:** Usually required (backend dependent)
- **Body:** `name`, `phone`, `message` (per collection sample)
- **Query:** `property_id`
- **Expected response fields (provisional):**
1. unlocked owner contact or
2. pass/credits required state message
- **Loading/Error/Empty:** unlock pending, unauthorized state, exhausted-credit/pass-required state
- **Mock replacement:** **Partial now** (API first, mock fallback with local credit wallet)

### 7) Pass activation/order
- **Screen:** unlock CTA fallback
- **Endpoint:** `/api/rental/passes/activate/`
- **Method:** `POST`
- **Auth:** likely required
- **Body (form-data):** `pass_type`
- **Query:** none
- **Expected response fields (provisional):** order/session/payment redirect details
- **Loading/Error/Empty:** pending state and recoverable payment error
- **Mock replacement:** **No full replacement yet** (endpoint present, response shape ambiguous)

---

## Owner Flows

### 1) Owner entry routing
- **Screen:** `/owner`
- **Endpoint:** `/api/rental/my/properties/`
- **Method:** `GET`
- **Auth:** Required
- **Body:** none
- **Query:** none
- **Expected response fields:** owner property list
- **Loading/Error/Empty:** loading shell, unauthorized redirect/login prompt, empty => list-property route
- **Mock replacement:** **Yes** for routing decision (API first, fallback mock list)

### 2) Owner dashboard / my properties
- **Screen:** `/owner/dashboard`
- **Endpoint:** `/api/rental/my/properties/`
- **Method:** `GET`
- **Auth:** Required
- **Body:** none
- **Query:** none
- **Expected response fields (normalized):**
1. `id`
2. `title`
3. `location`
4. `rent/deposit`
5. `status`
6. `thumbnail`
- **Loading/Error/Empty:** dashboard loader, empty property card with CTA, retry on error
- **Mock replacement:** **Yes** (API first, fallback mock)

### 3) Owner create listing
- **Screen:** `/owner/list-property`
- **Endpoint:** `/api/rental/my/properties/create/`
- **Method:** `POST` (multipart form-data)
- **Auth:** Required
- **Body fields (from collection):**
1. `title`
2. `property_type_id`
3. `city_id`
4. `rent`
5. `deposit`
6. `locality_id`
7. `address_line`
8. `bhk_id`
9. `built_up_area_sqft`
10. `furnishing_id`
11. `availability_id`
12. `description`
13. `contact_phone`
14. `amenity_ids`
15. `keywords`
16. `image_files` (file)
17. `document_type`
18. `document_file` (file)
- **Query:** none
- **Expected response fields:** created property payload + identifier (provisional)
- **Loading/Error/Empty:** submit loading, inline validation errors, submit failure banner
- **Mock replacement:** **Yes** where endpoint reachable; otherwise mock create is kept

### 4) Owner edit/update listing
- **Screen:** `/owner/property/[id]/edit`
- **Endpoint:** `/api/rental/my/properties/?property_id={id}`
- **Method:** `POST` (multipart form-data)
- **Auth:** Required
- **Body fields (collection update sample):**
1. `title`
2. `rent`
3. `deposit`
4. `locality_id`
5. `address_line`
6. `bhk_id`
7. `built_up_area_sqft`
8. `furnishing_id`
9. `availability_id`
10. `description`
11. `contact_phone`
12. `keywords`
13. `amenity_ids`
14. `clear_images`
15. `image_files`
16. `clear_documents`
17. `document_type`
18. `document_file`
- **Query:** `property_id`
- **Expected response fields:** updated property payload/status (provisional)
- **Loading/Error/Empty:** save loading, recoverable error banner, success toast/state
- **Mock replacement:** **Yes** (API first, fallback mock update)

### 5) Owner unlocked contacts view
- **Screen:** `/owner/contacts`
- **Endpoint:** no dedicated owner-contacts endpoint in Rentals collection
- **Method:** local derived state
- **Auth:** owner session required
- **Data source:** unlocked lead records from owner dashboard local store + unlock state
- **Loading/Error/Empty:** empty contacts message and unlock guidance
- **Mock replacement:** **Not yet** (backend endpoint missing in mapped Rentals set)

---

## Master Data Endpoints (used by owner form filters/selects)
- `GET /api/rental/masters/cities/`
- `GET /api/rental/masters/localities/?city_id=...`
- `GET /api/rental/masters/property-types/`
- `GET /api/rental/masters/bhk-types/`
- `GET /api/rental/masters/furnishing-types/`
- `GET /api/rental/masters/availability-types/`
- `GET /api/rental/masters/amenities/`
- `GET /api/rental/masters/keywords/`

Use defensive normalizers and preserve prior mock options when any master endpoint fails.

