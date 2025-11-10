# Backend Integrations and Progress API

This document describes the endpoints that power external platform integrations (LeetCode and Codeforces) and the user progress views.

The API is cookie-session based. Clients must first authenticate via the PESU login flow to obtain an `httpOnly` `session` cookie and then call the protected endpoints below.

- Base URL (default): http://localhost:8080
- All integration and progress endpoints require authentication (session cookie or Bearer token).

## Table of Contents

- Auth prerequisites
- Data model
- Linking external accounts
  - GET /api/integration/linked
  - PUT /api/integration/linked
- Stats endpoints
  - GET /api/integration/stats
  - GET /api/integration/stats/leetcode
  - GET /api/integration/stats/codeforces
- Username/handle verification
  - GET /api/integration/verify/leetcode/:username
  - GET /api/integration/verify/codeforces/:handle
- Progress endpoints
  - GET /api/progress/overview
  - GET /api/progress/:platform
- Error semantics
- Environment and deployment notes
- cURL examples

---

## Auth prerequisites

1) Login to create a session cookie:

POST /api/auth/login
Body:
{
  "username": "PES1UG2XXXXXX",
  "password": "••••••••"
}

- On success, the backend issues an `httpOnly` cookie named `session`.
- Subsequent requests must send that cookie (or optionally an Authorization: Bearer <token> header).

2) Validate session:

GET /api/auth/me

- Returns `200` with `{ ok: true, user: { profile, role, srn } }` if logged in.

---

## Data model

Linked external accounts are persisted in the `ExternalAccount` collection keyed by the user’s PESU profile email (from the logged-in session). A single document stores both LeetCode username and Codeforces handle:

ExternalAccount
- email: string (unique, lowercased)
- leetcodeUsername: string | null
- codeforcesHandle: string | null
- leetcodeConnected: boolean
- codeforcesConnected: boolean
- createdAt/updatedAt: Date

Notes:
- Connected flags are derived from whether a non-empty handle/username is present.
- Linking and unlinking are done by upserting this document by email.

---

## Linking external accounts

These routes link/unlink your LeetCode and/or Codeforces identities to your session user. They are keyed by your PESU profile email extracted from the session.

All routes below require authentication.

### GET /api/integration/linked

Returns the currently linked handles for the logged-in user.

Response 200:
{
  "ok": true,
  "linked": boolean,
  "email": "user@pes.edu",
  "leetcodeUsername": "someUser" | null,
  "codeforcesHandle": "some_handle" | null,
  "leetcodeConnected": boolean,
  "codeforcesConnected": boolean
}

If there is no mapping for the email yet, `linked` will be `false` and the handle fields will be `null`.

Errors:
- 400: Email not available in profile
- 500: Failed to read account mapping

### PUT /api/integration/linked

Upsert linked handles for the current user’s email. Any field omitted is left unchanged. An empty string or null clears the handle (unlink).

Body:
{
  "leetcodeUsername": "abc_def" | "" | null,
  "codeforcesHandle": "xyz_123" | "" | null
}

Response 200:
{
  "ok": true,
  "email": "user@pes.edu",
  "leetcodeUsername": "abc_def" | null,
  "codeforcesHandle": "xyz_123" | null,
  "leetcodeConnected": boolean,
  "codeforcesConnected": boolean
}

Errors:
- 400: Email not available in profile
- 500: Failed to update account mapping

Behavior:
- This endpoint does not itself verify the existence of the username/handle. Use the verification endpoints (below) prior to saving if you want enforcement in the client workflow.

---

## Stats endpoints

These routes fetch live stats from external platforms for the handles linked to the current user. They do not modify any stored data.

All routes below require authentication.

Common LeetCode payload shape:
leetcode: {
  "connected": boolean,      // whether a username is linked
  "exists": boolean | null,  // null when not connected
  "username": string | null,
  "totalSolved": number | null,
  "easy": number | null,
  "medium": number | null,
  "hard": number | null,
  "error"?: string
}

Common Codeforces payload shape:
codeforces: {
  "connected": boolean,
  "exists": boolean | null,
  "handle": string | null,
  "rank": string | null,
  "rating": number | null,
  "maxRank": string | null,
  "maxRating": number | null,
  "error"?: string
}

### GET /api/integration/stats

Fetch both LeetCode and Codeforces stats in one call.

Response 200:
{
  "ok": true,
  "leetcode": { ...see shape above... },
  "codeforces": { ...see shape above... }
}

Notes:
- Each platform is fetched independently. If one fails, the other can still succeed.

### GET /api/integration/stats/leetcode

Fetch only LeetCode stats for the linked username.

Response 200:
{
  "ok": true,
  "leetcode": { ...see shape above... }
}

Errors:
- 502: Failed to fetch LeetCode stats (upstream or network issue)

### GET /api/integration/stats/codeforces

Fetch only Codeforces stats for the linked handle.

Response 200:
{
  "ok": true,
  "codeforces": { ...see shape above... }
}

Errors:
- 502: Failed to fetch Codeforces stats (upstream or network issue)

---

## Username/handle verification

These endpoints check whether a given username/handle exists before linking.

All routes below require authentication.

### GET /api/integration/verify/leetcode/:username

Returns whether a LeetCode username exists.

Response 200:
{
  "ok": true,
  "platform": "leetcode",
  "username": "abc_def",
  "exists": true | false
}

Errors:
- 400: Invalid username format/length, or missing username
- 502: Upstream verification failed (network/GraphQL issue)

### GET /api/integration/verify/codeforces/:handle

Returns whether a Codeforces handle exists.

Response 200:
{
  "ok": true,
  "platform": "codeforces",
  "handle": "xyz_123",
  "exists": true | false
}

Errors:
- 400: Invalid handle format/length, or missing handle
- 502: Upstream verification failed (network/API issue)

---

## Progress endpoints

Progress endpoints expose a convenient shape for the “Progress” page, aggregating the linked accounts’ stats and a small summary.

All routes below require authentication.

### GET /api/progress/overview

Returns combined progress with a summary.

Response 200:
{
  "ok": true,
  "leetcode": { ...see LeetCode shape above... },
  "codeforces": { ...see Codeforces shape above... },
  "summary": {
    "anyConnected": boolean,
    "totalSolved": number | null,  // LeetCode solved, if available
    "currentRating": number | null // Codeforces rating, if available
  }
}

### GET /api/progress/:platform

Platform is one of: `leetcode` | `codeforces`

Returns platform-specific progress.

Response 200 (leetcode):
{
  "ok": true,
  "leetcode": { ...see LeetCode shape above... }
}

Response 200 (codeforces):
{
  "ok": true,
  "codeforces": { ...see Codeforces shape above... }
}

Errors:
- 400: Invalid platform
- 502: Upstream fetch failure

---

## Error semantics

- 400 Bad Request
  - Missing/invalid inputs (e.g., invalid username/handle format).
  - Email not available in the profile of the session.
- 401 Unauthorized
  - Missing or invalid session.
- 500 Internal Server Error
  - Database issues while reading/updating linked accounts.
- 502 Bad Gateway
  - Upstream service failure (LeetCode GraphQL or Codeforces API unreachable/errored).

Note: For “user not found” results, endpoints usually return `200` with `{ exists: false }` (verification endpoints) or `{ exists: false, error: "…not found" }` (stats endpoints).

---

## Environment and deployment notes

Environment variables (common):
- MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017/coderanker)
- JWT_SECRET: Secret for signing/verifying session JWTs (default: "development-secret")
- PESU_AUTH_BASE_URL: Base URL for PESU auth service (default: http://localhost:5000)
- PORT: Backend listen port (default: 8080)
- NODE_ENV: Set to "production" to enable secure cookies

CORS:
- The server enables CORS with credentials. Clients must send `credentials: "include"` and ensure their frontend origin is allowed by the deployment environment.

Session:
- Session tokens are stored in DB for revocation and TTL, and also set in an `httpOnly` cookie named `session`.

---

## cURL examples

Below examples assume:
- Backend at http://localhost:8080
- You will store and reuse cookies via `-c cookies.txt -b cookies.txt`

1) Login
curl -i -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"PES1UG2XXXXXX","password":"yourpass"}'

2) Check session
curl -i -b cookies.txt http://localhost:8080/api/auth/me

3) Check currently linked handles
curl -i -b cookies.txt http://localhost:8080/api/integration/linked

4) Verify prospective handles
curl -i -b cookies.txt http://localhost:8080/api/integration/verify/leetcode/john_doe
curl -i -b cookies.txt http://localhost:8080/api/integration/verify/codeforces/johndoe_123

5) Link or update handles (send empty string to unlink)
curl -i -b cookies.txt -X PUT http://localhost:8080/api/integration/linked \
  -H "Content-Type: application/json" \
  -d '{"leetcodeUsername":"john_doe","codeforcesHandle":"johndoe_123"}'

6) Fetch stats
curl -i -b cookies.txt http://localhost:8080/api/integration/stats
curl -i -b cookies.txt http://localhost:8080/api/integration/stats/leetcode
curl -i -b cookies.txt http://localhost:8080/api/integration/stats/codeforces

7) Fetch progress views
curl -i -b cookies.txt http://localhost:8080/api/progress/overview
curl -i -b cookies.txt http://localhost:8080/api/progress/leetcode
curl -i -b cookies.txt http://localhost:8080/api/progress/codeforces

---

## Implementation notes

- LeetCode stats are fetched via their GraphQL endpoint (matchedUser, acSubmissionNum).
- Codeforces stats are fetched via their public REST API (`user.info`).
- Network requests are time-bounded; transient errors are surfaced as 502 responses in stats/verification routes.
- The linking flow is keyed strictly by the PESU profile email in the session payload, ensuring one-to-one mapping per student email.
