# AssessmentEngine

AssessmentEngine is a lightweight MERN applicant assessment platform branded as:

`This research is powered by SidLabs LLP`

The app currently supports:
- candidate login with demo credentials
- protected frontend assessment flow
- candidate intake form with consent gate
- JSON-driven assessment instructions and MCQ engine
- timed submission flow
- MongoDB-backed submission storage
- thank-you and exit flow

## Project Overview

The product is designed as a minimal, production-minded screening tool. A candidate logs in, enters identifying details, reviews assessment instructions, completes a timed MCQ assessment, submits responses, and sees a completion screen.

The current implementation prioritizes:
- simple and readable architecture
- lightweight dependencies
- strict validation on both client and server
- testable flow boundaries
- clear separation between frontend state, backend validation, and persistence

## Architecture Summary

### Frontend

- `React + Vite`
- `react-router-dom` for route flow
- Context-based state for auth and assessment session data
- Plain CSS with shared design tokens in `theme.css`
- JSON-backed assessment definition loaded from local data

### Backend

- `Node + Express`
- cookie-based JWT auth
- modular route/controller/service structure
- Mongoose-backed MongoDB storage for submissions
- payload validation before storage

### Data Flow

1. Candidate logs in through `/api/auth/login`.
2. Frontend restores session through `/api/auth/session`.
3. Candidate details are validated client-side and server-side.
4. Assessment metadata and questions load from local JSON.
5. Timed assessment state lives in frontend context.
6. Final payload is submitted to `/api/submissions`.
7. Backend validates the payload and stores it in MongoDB.

## Folder Structure

```text
.
├── .env.example
├── package.json
├── README.md
├── client
│   ├── package.json
│   ├── public
│   └── src
│       ├── App.jsx
│       ├── App.test.jsx
│       ├── AppRoutes.jsx
│       ├── assets
│       ├── components
│       │   ├── ProtectedRoute.jsx
│       │   ├── SessionShell.jsx
│       │   └── TimerBadge.jsx
│       ├── config
│       ├── context
│       ├── data
│       │   ├── assessmentDefinition.js
│       │   └── masterAssessment.json
│       ├── pages
│       │   ├── AssessmentInstructionsPage.jsx
│       │   ├── AssessmentPage.jsx
│       │   ├── CandidateDetailsPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── LoginPage.jsx
│       │   └── ThankYouPage.jsx
│       ├── services
│       ├── test
│       ├── utils
│       ├── index.css
│       └── theme.css
└── server
    ├── index.js
    ├── package.json
    └── src
        ├── app.js
        ├── server.js
        ├── config
        │   ├── assessmentDefinition.js
        │   ├── auth.js
        │   ├── db.js
        │   └── env.js
        ├── controllers
        │   ├── authController.js
        │   ├── candidateDetailsController.js
        │   ├── healthController.js
        │   └── submissionController.js
        ├── middleware
        │   └── authMiddleware.js
        ├── models
        │   └── assessmentSubmissionModel.js
        ├── routes
        │   ├── authRoutes.js
        │   ├── candidateDetailsRoutes.js
        │   ├── healthRoutes.js
        │   └── submissionRoutes.js
        ├── services
        │   ├── authService.js
        │   ├── candidateDetailsService.js
        │   ├── healthService.js
        │   └── submissionService.js
        └── tests
            ├── auth.test.js
            ├── candidateDetails.test.js
            ├── health.test.js
            └── submission.test.js
```

## Setup Steps

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas or local MongoDB

### Install

```bash
npm install --prefix client
npm install --prefix server
```

### Environment Setup

Copy the template and fill in values:

```bash
cp .env.example .env
```

Current required variables:

- `ADMIN_EMAIL`
- `ADMIN_INITIAL_PASSWORD`
- `VITE_API_BASE_URL`
- `PORT`
- `NODE_ENV`
- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `JWT_SECRET`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

## `.env.example` Completeness Check

The current `.env.example` covers all environment variables required by the checked-in code paths.

Included:
- admin seed email and initial password
- frontend API base URL
- backend port and client origin
- Mongo connection URI
- JWT signing secret
- demo login credentials

Not included:
- Google Sheets credentials, because Google Sheets integration is not present in the current codebase

## Mongo Setup

The server uses Mongoose and expects a working `MONGODB_URI`.

### Local Mongo Example

```env
MONGODB_URI=mongodb://127.0.0.1:27017/assessment-engine
```

### MongoDB Atlas Example

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/assessment-engine?retryWrites=true&w=majority
```

Notes:
- the server will still boot if Mongo is unavailable, but submissions will not persist to Mongo in that case
- for real use, confirm Atlas network access and database user permissions
- collection used by the submission model is derived from the Mongoose model `AssessmentSubmission`

## Google Sheets Setup

Google Sheets integration is not currently implemented in this branch.

This is intentional: the earlier Sheets path was removed during the quality pass so the active submission pipeline is Mongo-only. If another engineer wants to add Sheets later, the recommended approach is:

1. add a dedicated backend service layer
2. keep credentials in backend env only
3. append to Sheets only after server-side payload validation
4. keep Mongo as the primary or fallback persistence path

There are no active Google Sheets env vars, services, routes, or tests in the current repo.

## Run Commands

From the repo root:

```bash
npm run dev:server
npm run dev:client
```

Default local URLs:
- frontend: `http://localhost:5173`
- backend: `http://localhost:5001`
- backend health: `http://localhost:5001/api/health`

Root helper scripts:

```bash
npm run dev:client
npm run dev:server
npm run build
npm run test
npm run lint
```

## Test Commands

All tests:

```bash
npm test
```

Frontend only:

```bash
npm --prefix client run test
npm --prefix client run lint
npm --prefix client run build
```

Backend only:

```bash
npm --prefix server run test
npm --prefix server run lint
```

## Demo Login And Seed Notes

There is no database seed script in the current implementation.

Authentication uses env-driven demo credentials:
- email: `candidate@sidlabs.com`
- password: `SidLabs@2026`

These values come from `.env` and are validated in the backend auth service. If another engineer wants persisted users later, that can replace the demo credential check without changing the frontend route flow.

## Admin Notes

Admin authentication is separate from candidate login.

Admin seed values:
- `ADMIN_EMAIL`
- `ADMIN_INITIAL_PASSWORD`

Current default admin identity:
- `evaluator@sidlabs.net`

Behavior:
- the admin account is seeded on server startup when MongoDB is connected
- only the hashed admin password is stored in MongoDB
- once the admin account exists, startup does not overwrite the password
- the admin can rotate the password later through `/admin/settings`

Admin frontend routes:
- `/admin/login`
- `/admin/dashboard`
- `/admin/submissions`
- `/admin/settings`

Admin backend routes:
- `POST /api/auth/admin/login`
- `GET /api/auth/admin/session`
- `POST /api/auth/admin/password`
- `GET /api/admin/dashboard`
- `GET /api/admin/submissions`

Access logging notes:
- backend API access events are logged with IP and proxy-derived source headers when available
- recent access signals are shown on the admin dashboard
- health checks are excluded from access-log capture to avoid noise

## Frontend Route Flow

- `/` -> redirects to `/login`
- `/admin` -> redirects to `/admin/login`
- `/admin/login` -> evaluator login
- `/admin/dashboard` -> protected admin dashboard
- `/admin/submissions` -> protected admin table view
- `/admin/settings` -> protected admin settings and password update
- `/login` -> candidate login
- `/dashboard` -> protected post-login entry page
- `/candidate-details` -> protected intake form
- `/assessment-instructions` -> protected explainer page
- `/assessment` -> protected timed MCQ screen
- `/thank-you` -> protected completion screen

## API Route Summary

### `GET /`

Basic API status response.

### `GET /api/health`

Returns API health status.

### `POST /api/auth/login`

Authenticates the demo candidate and sets the auth cookie.

Request body:

```json
{
  "email": "candidate@sidlabs.com",
  "password": "SidLabs@2026"
}
```

### `GET /api/auth/session`

Returns the currently authenticated session if the JWT cookie is valid.

### `POST /api/auth/logout`

Clears the auth cookie.

### `POST /api/auth/admin/login`

Authenticates the seeded admin evaluator and sets the auth cookie.

### `GET /api/auth/admin/session`

Returns the authenticated admin session if the JWT cookie is valid and the role is `admin`.

### `POST /api/auth/admin/password`

Protected admin route. Validates the current password, enforces strong new-password rules, hashes the replacement password, and updates the stored admin record.

### `GET /api/admin/dashboard`

Protected admin route. Returns overview metrics, recent submissions, recent activity, and recent access-log/IP signals for the evaluator dashboard.

### `GET /api/admin/submissions`

Protected admin route. Returns paginated submission rows with lightweight search and status filtering.

### `POST /api/candidate-details/validate`

Protected route. Validates candidate intake fields:
- `fullName`
- `age`
- `email`
- `location`
- `roleApplied`

### `POST /api/submissions`

Protected route. Validates and stores the assessment submission payload.

Main sections validated:
- `assessmentId`
- `candidateDetails`
- `metadata`
- `answers`
- `currentQuestionIndex`
- `reason`
- `session`
- `submittedAt`

## Assumptions

- demo auth is acceptable for the current screening workflow stage
- assessment questions are loaded from a local JSON file, not an admin CMS
- one active assessment definition is sufficient for the current product scope
- MongoDB is the canonical persistence path for submissions
- the client timer is user-facing only; the server still validates session timing structure on submit
- thank-you flow is intentionally simple and non-technical for candidates

## Deployment Notes

### Frontend

- build with `npm run build`
- serve the generated `client/dist` with any static host
- set `VITE_API_BASE_URL` to the deployed backend URL before building

### Backend

- deploy as a Node.js service
- set `CLIENT_ORIGIN` to the deployed frontend origin
- set a strong `JWT_SECRET`
- set a production `MONGODB_URI`
- enable HTTPS in front of the app so secure cookie settings can be tightened in future work

### Production Follow-Ups

- move demo auth to persisted users or invite-based credentials
- harden cookie settings for production domain/HTTPS
- add submission observability and audit logging
- add retry/queue behavior if external integrations are introduced later

## Future Enhancements

- persisted candidate/user records instead of demo env credentials
- admin upload or CMS-based assessment definitions
- multi-assessment support
- backend scoring and analytics
- Google Sheets or other export adapters as secondary integrations
- submission review dashboard
- rate limiting and brute-force protection on auth routes
- stronger session controls and attempt replay protection

## Final Verification Checklist

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` and `JWT_SECRET`.
3. Install dependencies for `client` and `server`.
4. Start backend with `npm run dev:server`.
5. Start frontend with `npm run dev:client`.
6. Log in with the configured demo credentials.
7. Complete candidate details and consent.
8. Start the assessment and answer a few questions.
9. Submit and confirm the thank-you page appears.
10. Run `npm test`.
11. Run `npm run lint`.
12. Run `npm run build`.

## Git-Ready Suggested Commit Sequence

If you want to split the work into reviewable commits, this sequence is reasonable:

1. `chore: scaffold client and server foundation`
2. `feat: add auth and protected routing`
3. `feat: add candidate intake and instructions flow`
4. `feat: build timed assessment engine`
5. `feat: add submission api and mongodb storage`
6. `feat: add thank-you flow and final ui polish`
7. `chore: remove sheets path and complete quality pass`
8. `docs: finalize readme and handoff notes`

## Handoff Notes

- MongoDB is the only active persistence integration in the current branch.
- Google Sheets is documented here only as a future extension point, not as a configured feature.
- The frontend flow is complete enough for end-to-end local testing.
- The backend already validates candidate details and submission payload shape before storage.
- Tests are lightweight but cover the critical user and validation paths requested so far.
- Direct git push was not performed in this environment. No remote push has been claimed or simulated.
