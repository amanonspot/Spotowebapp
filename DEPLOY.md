# Spotowebapp — Production deploy (admin dashboard + latest features)

Deploy **backend first**, then **frontend**. Admin console lives at `/admin/dashboard`.

---

## 1. Backend (`spoto-backend`)

```bash
ssh ubuntu@<backend-server>
cd ~/spoto-backend
git pull origin main
source env/bin/activate   # or your venv path
pip install -r requirements.txt
python manage.py migrate
sudo systemctl restart gunicorn   # or your process name
```

Verify: `GET https://production.api.spoto.in/api/user/details/` (authenticated) returns `"is_staff": true` for staff users.

---

## 2. Grant admin access (staff users)

Users must exist in DB (log in once via OTP on production). Then on the **backend server**:

```bash
cd ~/spoto-backend/spoto
source ../env/bin/activate
python manage.py set_staff_users --phones 7002130551,9839388192
```

Re-run after new admins sign up. To remove access: add `--revoke`.

---

## 3. Frontend (`Spotowebapp`)

### Env (production)

Use `.env.example` as reference. **Critical:**

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://production.api.spoto.in` |
| `NEXT_PUBLIC_OWNER_MOCK_MODE` | `false` |
| `NEXT_PUBLIC_RENTALS_MOCK_MODE` | `false` |
| `NEXT_PUBLIC_ENV` | `production` |
| `NEXT_PUBLIC_GA_DEBUG_MODE` | `false` |

`NEXT_PUBLIC_*` are baked in at **build time** — rebuild after changing them.

### Build & restart

```bash
ssh ubuntu@<frontend-server>
cd /var/www/spoto   # adjust path
git pull origin main
npm ci
npm run build
pm2 reload spoto-nextjs   # or: pm2 restart ecosystem.config.js
```

Docker: pass the same vars as `--build-arg` (see `Dockerfile`).

---

## 4. Smoke test after deploy

1. Log in with `7002130551` or `9839388192` (OTP).
2. Profile menu shows **phone**, not UUID.
3. **Admin Console** link appears in profile / header (staff only).
4. Open `/admin/dashboard` — stats and pending listings load.
5. `/admin/agents` — create/link agent works.

---

## 5. Rollback

- Backend: `git checkout <prev-commit>` + restart gunicorn.
- Frontend: `git checkout <prev-commit>` + `npm run build` + pm2 reload.
