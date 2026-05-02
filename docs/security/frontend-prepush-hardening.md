# Frontend Pre-Push Security Hardening (Next.js)

Date: 2026-04-19  
Scope: tenant + owner frontend hardening before production push

## Fixed in this pass

1. Removed publicly served API collections from `public/`:
   - `public/postman/Spoto - APIs.postman_collection (2).json`
   - `public/postman/new/Spoto - APIs.postman_collection.json`
   - `public/assets/images/Spoto - APIs.postman_collection (1).json`

2. Removed hardcoded Google API key fallback values from client config:
   - `src/config/config.ts`

3. Added production security headers and tightened runtime config:
   - CSP
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `X-Frame-Options`
   - `Permissions-Policy`
   - disabled `x-powered-by`
   - explicit `productionBrowserSourceMaps: false`
   - removed wildcard image host rule and production localhost image allowance
   - enabled production console stripping via Next compiler
   - file: `next.config.ts`

4. Reduced unsafe API/error leakage:
   - sanitized API error messaging to avoid raw backend payload leakage
   - removed API error payload attachment from thrown client errors
   - file: `src/lib/api/client.ts`

5. Removed sensitive debug logging from core auth/booking/user/event services:
   - `src/lib/api/services/auth.service.ts`
   - `src/lib/api/services/booking.service.ts`
   - `src/lib/api/services/user.service.ts`
   - `src/lib/api/services/event.service.ts`

6. Removed fixed Basic auth header pattern from payment session call:
   - `src/lib/api/services/booking.service.ts`

7. Safer external navigation handling:
   - added `rel="noopener noreferrer"` for `_blank` links
   - added `noopener,noreferrer` to `window.open(...)`

8. Tightened owner-side upload and keyword inputs:
   - explicit upload `accept` constraints for images/documents
   - custom keyword sanitization and max length
   - file: `src/components/owner/OwnerListingForm.tsx`

9. Disabled owner mock OTP mode by default in production:
   - file: `src/lib/adapters/authAdapter.ts`

## Backend-dependent follow-ups

1. Move auth from localStorage tokens to secure HttpOnly cookie sessions/JWT cookie strategy.
2. Enforce authorization strictly on backend for all owner/tenant actions (frontend route guards are UX-only).
3. Standardize backend error shape and avoid exposing internal trace/debug details in API responses.
4. Enforce upload MIME/type/size validation server-side (frontend restrictions are assistive only).

## Remaining risk notes

1. CSP is intentionally practical (not maximal) to avoid breaking maps/payment integrations.
2. Legacy code paths may still rely on localStorage auth tokens until backend cookie auth is implemented.
3. If new third-party script/image domains are added later, CSP and `next.config.ts` image allowlist must be updated intentionally.

## Pre-push checklist

- [ ] Confirm no sensitive files remain under `public/`.
- [ ] Confirm `.env*` files are not committed.
- [ ] Set production env vars explicitly (especially maps keys and API base URL).
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Smoke-test owner + tenant primary flows.
- [ ] Verify browser console has no sensitive payload dumps in production build.
