# Centralized Management System - State of the System

Last updated: 2026-04-07  
Scope reviewed: `frontend`, `backend`, `ibt-mobile`

## 1) System Flow & Architecture Map

### High-level architecture
- `frontend` (React + Vite, deployed on Vercel): role-based admin web portal for Superadmin, Bus, Terminal, Parking, Tenant/Lease, and Lost & Found admins.
- `backend` (Express + MongoDB, deployed on Render): single API surface for all modules (`/api/*`) including admin auth, reports, operations, archives, deletion requests, and mobile endpoints.
- `ibt-mobile` (Expo React Native): tenant/vendor-facing app for stall application, route board, lost-and-found view, and profile/auth flows.

### Current role routing/auth flow (web)
- Login entry is `frontend/src/pages/AdminLogIn.jsx`.
- On successful login, role is stored in `localStorage` (`authRole`, `authToken`, `isAdminLoggedIn`) and user is redirected by role:
  - `superadmin` -> `/dashboard`
  - `bus` -> `/buses-trips`
  - `ticket` -> `/tickets`
  - `parking` -> `/parking`
  - `lostfound` -> `/lost-found`
  - `lease` -> `/tenant-lease`
- Route gating is client-side only in `frontend/src/App.jsx` via `PrivateRoute` and `allowedRoles`.

### Backend authorization reality
- JWT creation exists in `backend/controllers/adminController.js`.
- Token verification middleware exists (`backend/middleware/authMiddleware.js`), but **most admin/business routes are not protected with `verifyToken` nor role guards**.
- Only a few routes currently use token checks (example: some admin recovery endpoints and stall protected mobile endpoints).
- Result: role authorization is mostly enforced in UI, not in API.

## 2) Current Progress (Module by Module)

Status legend:
- Implemented = feature exists and is wired to API/data.
- Partial = present but incomplete, weakly protected, or inconsistent.
- Missing = intended capability not implemented in observable code.

### Superadmin
Implemented:
- Revenue dashboard (`frontend/src/pages/Dashboard.jsx`) aggregating Tickets, Bus, Tenants, Parking, Reports.
- Employee/admin management (`frontend/src/pages/EmployeeManage.jsx`, `backend/routes/adminRoutes.js`).
- Reports review and archive workflows (`frontend/src/pages/Reports.jsx`, `backend/routes/reportRoutes.js`).
- Deletion request approval UI (`frontend/src/pages/DeletionRequests.jsx`, `backend/routes/deletionRequestRoutes.js`).
- Central archive view/restore (`frontend/src/pages/Archive.jsx`, `backend/routes/archiveRoutes.js`).

Partial:
- Price controls are spread across module pages (Bus/Parking/Terminal) and not centrally governed.
- Superadmin-only authority is mostly frontend-enforced; backend role checks are largely absent.

Missing:
- No clear centralized "admin pages governance layer" on backend (role policy middleware per module).
- Data archival governance/audit hardening (immutable audit trail and strict permission checks) is incomplete.

### Bus Admin
Implemented:
- Bus operations, trip CRUD, dispatch board, predefined schedules (`frontend/src/pages/BusesTrips.jsx`, `backend/routes/busTripRoutes.js`, `backend/routes/dispatchBoardRoutes.js`, `backend/routes/predefinedScheduleRoutes.js`).
- Collector selection integrated (collector id/name) and report submission via `submitPageReport`.
- Deletion request submission flow to superadmin and archive hooks.

Partial:
- Shift report generation is present but relies on mixed assumptions (frontend payload + backend auto-derivation).
- Backend route-level role restriction for bus endpoints is not enforced.

Missing:
- Strong server-side validation that only Bus Admin can perform bus-specific actions.

### Terminal Admin
Implemented:
- Manual ticket logbook workflow (`frontend/src/pages/TerminalFees.jsx`, `backend/routes/terminalFeeRoutes.js`).
- Collector name required before report submission.
- Deletion request + archive behaviors present.

Partial:
- Collector is plain text in this module (not consistently normalized to collector entity/id).
- No backend role enforcement for terminal-only operations.

Missing:
- Strong server authorization and collector entity consistency with Bus module.

### Parking Admin
Implemented:
- Manual parking ticketing + departure processing (`frontend/src/pages/Parking.jsx`, `backend/routes/parkingRoutes.js`).
- Collector name required before report submission.
- Price settings and rate application logic.
- Deletion request + archive behaviors.

Partial:
- Server-side role control is missing.
- Pricing governance is module-local (not centrally constrained).

Missing:
- Policy enforcement ensuring only authorized roles can change rates or process key actions.

### Tenant Admin (Lease)
Implemented:
- Tenant records, waitlist/applications, payment review, renewals, overdue settings, move-out, broadcast, and email (`frontend/src/pages/TenantLease.jsx`, `backend/routes/tenantRoutes.js`, `backend/routes/waitlistRoutes.js`, `backend/routes/broadcastRoutes.js`).
- Report submission and archival/deletion flows.
- Mobile tenant app features consume tenant/stall/auth APIs (`ibt-mobile/app/(tabs)/stalls.tsx`, `backend/routes/stallRoutes.js`, `backend/routes/authRoutes.js`).

Partial:
- Role naming consistency varies (`lease`, `tenant`, `tenantadmin`, `tenant admin`) across UI logic.
- Backend endpoints are broadly open from an authorization perspective.

Missing:
- Strict tenant-admin server policy boundaries.

### Lost and Found Admin
Implemented:
- Item CRUD, claim/unclaim status, evidence/image upload and display (`frontend/src/pages/LostFound.jsx`, `backend/routes/lostfoundRoutes.js`).
- Report, archive, and deletion request flows.

Partial:
- Role aliases are inconsistent (`lostfound` vs `lostandfound` in some filters).
- Role protection is mostly UI-only.

Missing:
- Strong backend role-based restrictions and normalized role constants.

## 3) API & Deployment Audit

### Frontend -> Backend (Vercel to Render)
- Frontend uses `VITE_API_URL` with localhost fallback in many files.
- Current `frontend/.env` points to local backend (`http://localhost:10000`), which will fail in production unless Vercel environment variables override it.
- Positive: fallback pattern exists almost everywhere; easy to standardize if envs are set correctly.

### Mobile -> Backend (Expo app to Render)
- Mobile hardcodes Render URL in `ibt-mobile/src/config.js`:
  - `https://software-engineering-backend-isyd.onrender.com/api`
- This works for production, but environment-based config is preferable for staging/dev parity.

### CORS and environment issues
- Backend CORS currently allows `origin: "*"` while also setting `credentials: true` in `backend/server.js` (unsafe and logically inconsistent for credentialed requests).
- `ALLOWED_ORIGINS` appears in backend env but is not used by CORS config.

### Hardcoded/local URL risks
- Many frontend files fallback to `http://localhost:10000`; production break risk if `VITE_API_URL` is missing.
- Mobile is production-hardcoded; local testing/staging requires manual edits.

### Critical security/deployment finding
- Secrets are committed in `backend/.env` (DB URI, JWT, SMTP/cloud keys). These must be rotated and removed from git history as soon as possible.

## 4) Error Log & Broken Links (Observed Risks)

### Confirmed build/compile state
- `frontend` production build succeeds (`npm run build`), so no immediate compile-blocking errors were found there.

### Functional/code risks
- **Role mismatch bug in Reports UI**: `frontend/src/pages/Reports.jsx` checks `role === "lol"` for a control, which is likely a typo/unused condition.
- **Role naming drift** across app (`lease` vs `tenant admin` / `tenantadmin`; `lostfound` vs `lostandfound`) can cause permission/filter inconsistencies.
- **Backend endpoint exposure**: most routes are callable without JWT/role verification.
- **Deletion handling split-brain**: `DeletionRequests` frontend archives+deletes for multiple modules, while backend `deletionRequestController` hardcodes direct delete only for Terminal Fee on approve. Behavior is inconsistent depending on caller path.
- **Potential duplicate/maintenance issue** in `backend/routes/terminalFeeRoutes.js` (duplicated route declarations for `get`/`post`/`put` paths).

### Route/dead-end observations
- UI route structure is complete for declared role modules in `frontend/src/App.jsx`.
- Main dead-end risk is not missing route files, but inconsistent role strings that can hide actions/components unexpectedly.

## 5) Actionable Fixes & Next Steps (Prioritized)

### P0 - Immediate
- [ ] Remove all secrets from repository-tracked `.env` files; rotate compromised keys/secrets (JWT, DB, SMTP, Cloud keys).
- [ ] Add backend auth guards (`verifyToken`) to protected module routes.
- [ ] Add role-based middleware (e.g., `requireRole("superadmin")`, `requireRole("bus")`, etc.) and enforce per endpoint.
- [ ] Replace `origin: "*"` CORS config with env-driven allowlist from `ALLOWED_ORIGINS`.

### P1 - Architecture alignment
- [ ] Centralize role constants shared by frontend/backend to eliminate `lostfound/lostandfound`, `lease/tenantadmin` drift.
- [ ] Standardize collector handling (entity+id) across Bus, Terminal, and Parking.
- [ ] Consolidate deletion approval logic so archiving/deletion is server-authoritative (single source of truth in backend).
- [ ] Normalize price management governance so superadmin policy is enforced server-side.

### P2 - Quality & maintainability
- [ ] Fix obvious typo/unused condition `role === "lol"` in Reports UI.
- [ ] Refactor duplicated terminal fee routes and clean route definitions.
- [ ] Add backend integration tests for role authorization boundaries and deletion approval flows.
- [ ] Replace fallback localhost strategy with strict required env checks for production builds.
- [ ] Replace mobile hardcoded API base URL with environment profile config (dev/staging/prod).

---

## Quick File Map (Key Evidence)
- Web routing/auth: `frontend/src/App.jsx`, `frontend/src/pages/AdminLogIn.jsx`
- Sidebar role navigation: `frontend/src/components/layout/sidebar/navItems.js`
- Superadmin modules: `frontend/src/pages/Dashboard.jsx`, `Reports.jsx`, `EmployeeManage.jsx`, `DeletionRequests.jsx`, `Archive.jsx`
- Role module pages: `BusesTrips.jsx`, `TerminalFees.jsx`, `Parking.jsx`, `TenantLease.jsx`, `LostFound.jsx`
- Backend API composition: `backend/server.js`
- Admin auth/token logic: `backend/controllers/adminController.js`, `backend/middleware/authMiddleware.js`
- Core routes: `backend/routes/*.js` (notably `adminRoutes.js`, `busTripRoutes.js`, `terminalFeeRoutes.js`, `parkingRoutes.js`, `tenantRoutes.js`, `lostfoundRoutes.js`, `reportRoutes.js`)
- Mobile API base: `ibt-mobile/src/config.js`
