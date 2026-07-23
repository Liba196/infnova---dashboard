# Building the INFNOVA Applicant Dashboard — Full Tutorial

This is a complete walkthrough of how this project was built, from an empty
folder to the finished app. It's written for someone new to frontend
development, so it explains not just *what* each file does but *why* it
exists and *why* it's shaped the way it is.

---

## 1. THE ARCHITECTURE & TOOLING

### Why this stack

The challenge required React or Next.js with TypeScript, and left everything
else open. Here's the reasoning behind each choice:

| Layer | Choice | Why |
|---|---|---|
| Framework | **React + Vite** | Next.js adds server-side routing, server components, and a build system built for deployment on Vercel's specific model. None of that is needed for a client-only dashboard that talks to an external API. Vite gives a plain React app with instant dev-server startup and fast rebuilds, which matters when you're iterating quickly against a live API under a deadline. |
| Language | **TypeScript** | Required by the brief. Beyond that, it catches mistakes like "I typo'd a field name from the API" at compile time instead of at runtime in front of an interviewer. |
| Routing | **React Router** | The de facto standard for client-side routing in a Vite+React app (Next.js has routing built in; plain React does not). We need at minimum `/login`, `/` (dashboard), and `/applicants/:id` (detail), plus a way to guard routes behind authentication. |
| Styling | **Tailwind CSS (v4)** | Utility classes let you build and rearrange layouts fast without hopping between a `.tsx` file and a separate `.css` file. Given a 5-day deadline, that speed matters more than the alternative (CSS Modules, styled-components), and there's no scale/team-convention reason here to prefer those instead. |
| Data fetching | **TanStack Query** | This is the single biggest leverage decision in the project. The brief explicitly asks for loading, error, and empty states, plus a paginated, filterable list. TanStack Query gives you `isLoading`/`isError`/`data` out of the box, built-in retry logic, automatic refetching, and cache invalidation after a mutation (like the status update) — all things you'd otherwise hand-write with `useEffect` and multiple `useState` calls. |
| Auth | **React Context** | The app only needs to share one small piece of state (the token + user) across the whole tree. Context is the right-sized tool; Redux or Zustand would be overkill for this. |
| Forms | **React Hook Form** | Used for the login form. It manages input state, validation, and submission without re-rendering the whole form component on every keystroke. |
| Icons | **Lucide React** | A clean, consistent icon set with an icon per concept we needed (mail, phone, search, chevrons, external link). |
| Notifications | **React Hot Toast** | Used to confirm the status-update mutation succeeded or failed, without blocking the UI with a modal. |
| Deployment | **Vercel** | Free, zero-config for a Vite static build, and matches what the challenge's own API is hosted on. |

### Exact initializer command

The project was started with Vite's official scaffolding tool, using the
`react-ts` template (React + TypeScript, no extra flags):

```bash
npm create vite@latest infnova-dashboard -- --template react-ts
```

This generates a minimal working React+TypeScript+Vite app: a handful of
config files, an `index.html`, and a `src/` folder with a default counter
app. Everything else in this project — routing, auth, the API layer, every
component — was added on top of that starting point.

### Versions actually installed

At the time this was built, these were the resolved versions (yours may
differ slightly if you install fresh, and that's expected and fine — the
`^` in `package.json` allows compatible minor/patch updates):

- React 19.2.7 / React DOM 19.2.7
- TypeScript ~6.0.2
- Vite 5.4.21 (deliberately *not* the newest Vite 8 — see the note in
  section 5 about why)
- Tailwind CSS 4.3.3, via the `@tailwindcss/vite` plugin (Tailwind v4
  dropped the old `tailwind.config.js` + PostCSS setup in favor of a Vite
  plugin and CSS-based config — more on this in section 4)
- TanStack Query 5.101.2
- React Router DOM 7.18.1
- React Hook Form 7.82.0
- Lucide React 1.25.0
- React Hot Toast 2.6.0

---

## 2. FOLDER-BY-FOLDER BREAKDOWN

Here's the full tree (excluding `node_modules`, which is just installed
dependencies, and `dist`, which is the generated production build output —
neither is something you write by hand):

```
infnova-dashboard/
├── .env                        # local environment variables (not committed)
├── .env.example                # template showing what env vars are needed
├── .gitignore                  # tells Git what not to track
├── .oxlintrc.json               # linter configuration
├── README.md                   # project documentation for submission
├── index.html                  # the single HTML page the whole app mounts into
├── package.json                # project metadata, dependencies, scripts
├── package-lock.json           # exact locked dependency versions
├── tsconfig.json               # root TypeScript config (references the two below)
├── tsconfig.app.json           # TypeScript rules for your app code (src/)
├── tsconfig.node.json          # TypeScript rules for config files (vite.config.ts)
├── vite.config.ts              # Vite's own configuration (plugins, etc.)
├── public/
│   ├── favicon.svg             # browser tab icon
│   └── icons.svg                # unused default Vite asset (safe to delete)
└── src/
    ├── main.tsx                 # the actual entry point — mounts React into the page
    ├── App.tsx                  # top-level component: sets up providers + routes
    ├── index.css                # global styles + Tailwind + design tokens
    ├── components/               # reusable, presentational pieces (no page-level logic)
    ├── context/                  # React Context providers (just auth, here)
    ├── hooks/                    # custom React hooks (data fetching, URL state, debounce)
    ├── lib/                      # framework-agnostic logic: API client, formatting, query client
    ├── pages/                    # one component per route/screen
    ├── routes/                   # routing helpers (the auth guard)
    └── types/                    # TypeScript type definitions, shared across the app
```

### Why this particular folder split

This is a fairly conventional "feature-flat" structure for a small-to-medium
React app. The guiding idea for each folder:

- **`components/`** — things that render UI and take props, but don't know
  *where* their data comes from. `<StatusBadge status="pending" />` doesn't
  care if that status came from a list or a detail page.
- **`pages/`** — the opposite: these know exactly which route they're for,
  and they're the ones that call hooks to fetch data and then hand it down
  to `components/`.
- **`hooks/`** — logic that needs React's hook rules (state, effects) but
  isn't tied to any one screen. `useApplicants` could be called from
  anywhere; it happens to only be called from `DashboardPage`.
- **`lib/`** — plain functions and objects, no React involved at all. You
  could unit-test everything in here without rendering a single component.
- **`context/`** and **`routes/`** are small enough to each get one file,
  but are separated from `hooks/`/`components/` because they're
  structural — they wrap the whole app rather than being used inside a
  particular screen.
- **`types/`** is separated so that both `lib/` and every UI layer can
  import the same definitions without circular imports.

---

## 3. FILE-BY-FILE EXPLANATION & CODE

Every file below is reproduced in full — nothing is abbreviated.

### `index.html`

**Path:** `/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>infnova-dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

This is the *only* real HTML page in the entire app. Everything you see in
the browser — the login form, the table, the detail page — is JavaScript
that React injects into `<div id="root"></div>` at runtime. That's what
"single-page application" means. The `<script type="module" src="/src/main.tsx">`
line is what tells the browser to run our actual app code; Vite handles
compiling that TypeScript/JSX into something the browser understands.

---

### `src/main.tsx`

**Path:** `/src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This is the entry point referenced by `index.html`. It does exactly three
things:
1. Imports the global CSS file, so Tailwind's styles are loaded once for the
   whole app.
2. Finds the `<div id="root">` from `index.html` (the `!` tells TypeScript
   "trust me, this element exists, don't make me null-check it").
3. Renders `<App />` into it, wrapped in `<StrictMode>`, which is a
   React development helper that highlights potential bugs (like impure
   side effects) by intentionally double-invoking some functions in dev
   mode. It has no effect on the production build.

This file was untouched from what `npm create vite@latest` generates — it
almost never needs to change.

---

### `src/App.tsx`

**Path:** `/src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicantDetailPage } from './pages/ApplicantDetailPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/applicants/:id" element={<ApplicantDetailPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

This is the architectural skeleton of the whole app. Read it from the
outside in — each wrapper adds one capability to everything inside it:

- **`<QueryClientProvider client={queryClient}>`** — makes TanStack Query
  available to every component below it. Without this, calling
  `useQuery(...)` anywhere in the app would throw an error.
- **`<AuthProvider>`** — makes `useAuth()` (token, login, logout) available
  everywhere below it.
- **`<BrowserRouter>`** — enables React Router's URL-based navigation.
- **`<Toaster />`** — renders toast notifications; it's placed once at the
  top so any component anywhere can call `toast.success(...)` and have it
  appear.
- **`<Routes>` / `<Route>`** — this is the actual route table:
  - `/login` is public — anyone can reach it.
  - Everything nested inside `<Route element={<ProtectedRoute />}>` requires
    a valid token (explained in `ProtectedRoute.tsx` below). Nesting
    `<Layout />` *inside* that means the header/logout bar only renders for
    authenticated screens — the login page gets a clean, header-free layout.
  - `path="*"` is a catch-all: any unmatched URL redirects to `/`, which
    itself will bounce to `/login` if you're not authenticated.

---

### `src/index.css`

**Path:** `/src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
@import "tailwindcss";

@theme {
  /* Palette: warm paper ground, deep forest ink-green accent.
     Deliberately avoiding purple/terracotta/near-black-neon defaults —
     this reads as a review desk, not a SaaS marketing page. */
  --color-paper: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-ink: #1A1D1B;
  --color-ink-muted: #62675F;
  --color-border: #E3E1DA;
  --color-accent: #2F5D4F;
  --color-accent-soft: #E7EFEA;
  --color-accent-hover: #24483D;

  --color-status-pending: #9A6B15;
  --color-status-pending-bg: #FBF1DD;
  --color-status-reviewed: #2D5FA6;
  --color-status-reviewed-bg: #E7EFF9;
  --color-status-accepted: #2F5D4F;
  --color-status-accepted-bg: #E7EFEA;
  --color-status-rejected: #A13B34;
  --color-status-rejected-bg: #F8E9E7;

  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}

html, body, #root {
  height: 100%;
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

/* Signature element: applicant status renders like a review stamp —
   slight rotation, doubled border, monospace caps. Ties directly to
   the act of reviewing/triaging applications rather than decorating it. */
.stamp {
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  transform: rotate(-1.5deg);
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Breaking this down:

- **Line 1**: loads two Google Fonts (IBM Plex Sans for body text, IBM Plex
  Mono for the status "stamp" badges and code-like UI). This `@import` for
  a URL must come *before* `@import "tailwindcss"` — CSS requires all
  `@import` rules to be at the very top of the file, and this specific
  ordering tripped up the build once during development (see section 5).
- **`@import "tailwindcss"`**: this single line is how Tailwind v4 is
  wired in — no separate config file needed (more in section 4).
- **`@theme { ... }`**: this is Tailwind v4's new way of defining design
  tokens directly in CSS. Every `--color-*` and `--font-*` variable defined
  here automatically becomes a Tailwind utility class — `--color-accent`
  becomes usable as `bg-accent`, `text-accent`, `border-accent`, etc.,
  anywhere in the app's JSX. This is *the* file that defines the app's
  entire visual identity: a warm off-white background, a deep forest green
  accent (deliberately not the common purple/terracotta AI-generated
  defaults), and distinct background/foreground color pairs for each of the
  four applicant statuses.
- **`.stamp`**: a small custom class used only by `StatusBadge.tsx`, giving
  status badges a slight rotation and monospace font — a "rubber stamp"
  visual metaphor for a review/triage tool.
- **`:focus-visible`**: ensures anything focused via keyboard (Tab key) gets
  a clearly visible outline — an accessibility requirement, not just a
  design nicety.
- **`prefers-reduced-motion`**: respects the OS-level setting some people
  turn on if animations cause them discomfort, by collapsing all
  animation/transition durations to effectively zero.

---

### `src/types/auth.ts`

**Path:** `/src/types/auth.ts`

```ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // seconds
  user: AuthUser;
}
```

These three interfaces describe, in TypeScript's type system, the exact
shape of data going into and coming out of the login endpoint. `LoginRequest`
is what we send; `LoginResponse` is what the API sends back (confirmed
against the real `/api/docs` schema — it nests a `user` object and gives us
`expiresIn`, which the auth logic later uses to schedule an automatic
logout). Defining these up front means every other file that touches login
data gets autocomplete and compile-time checking instead of guessing at
field names.

---

### `src/types/applicant.ts`

**Path:** `/src/types/applicant.ts`

```ts
// Confirmed against /api/docs schemas (Applicant, PaginatedApplicants).

export type ApplicantStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';
export type ApplicantTrack = 'frontend' | 'backend' | 'ui-ux' | 'data-analytics' | 'mobile';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Shape returned by GET /applicants (list) — lighter than the full record.
export interface ApplicantSummary {
  id: string;
  fullName: string;
  email: string;
  country: string;
  track: ApplicantTrack;
  status: ApplicantStatus;
  applicationDate: string; // ISO date-time
}

// Shape returned by GET /applicants/:id (detail).
export interface Applicant extends ApplicantSummary {
  phoneNumber: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedInUrl?: string;
  motivation?: string;
  notes?: string;
  updatedAt: string;
}

export interface ApplicantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicantStatus | '';
  track?: ApplicantTrack | '';
  country?: string;
  experienceLevel?: ExperienceLevel | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  delay?: number; // dev-only: demo loading state, max 5000ms
  simulateError?: boolean; // dev-only: forces a 500 for error-state testing
}

// `meta` wasn't expanded in the docs screenshot — using the conventional
// shape (page/limit/total/totalPages). If the real payload differs, this
// is the one interface to fix; everything else reads through it.
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicantListResponse {
  data: ApplicantSummary[];
  meta: PaginationMeta;
}

export const APPLICANT_STATUSES: ApplicantStatus[] = ['pending', 'shortlisted', 'accepted', 'rejected'];
export const APPLICANT_TRACKS: ApplicantTrack[] = ['frontend', 'backend', 'ui-ux', 'data-analytics', 'mobile'];
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export interface ApplicantStats {
  total: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
}
```

This is arguably the most important file in the whole project, because
almost every other file imports something from it. Key design decisions:

- **`ApplicantStatus`, `ApplicantTrack`, `ExperienceLevel` as string union
  types**, not `enum`. TypeScript unions (`'pending' | 'shortlisted' | ...`)
  map directly onto plain JSON strings the API sends, with zero runtime
  overhead — a `switch` or object lookup (like in `StatusBadge.tsx`) can use
  them directly as object keys.
- **`ApplicantSummary` vs `Applicant`**: the docs showed that the *list*
  endpoint returns a smaller object (no skills, no links, no experience
  level) than the *detail* endpoint. Modeling that with `interface Applicant
  extends ApplicantSummary` means TypeScript enforces that the detail object
  is a strict superset of the summary — if the API ever adds a new list
  field, adding it to `ApplicantSummary` automatically makes it available on
  `Applicant` too.
- **The `APPLICANT_STATUSES` / `APPLICANT_TRACKS` / `EXPERIENCE_LEVELS`
  arrays** exist so the *type* and the *runtime list of values* stay in
  sync in one place. `ApplicantFilters.tsx` loops over `APPLICANT_STATUSES`
  to build the `<select>` dropdown — if the API ever adds a fifth status,
  you add it here once and the dropdown, the type-checking, and the status
  badge colors all need to be updated together (TypeScript will actually
  error out on the badge/label lookup objects until you do, because they're
  typed as `Record<ApplicantStatus, string>`).
- **Comments flagging assumptions** (`PaginationMeta`, `getStats`) are
  intentional — they mark places where the real API docs didn't fully
  confirm a shape, so future-you (or you, right now) knows exactly what to
  double check rather than trusting silently.

---

### `src/lib/api.ts`

**Path:** `/src/lib/api.ts`

```ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://infnova-intern.vercel.app/api';

export class ApiError extends Error {
  status: number;
  isSessionExpired: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Treat 401 as the expired/invalid-session signal. If the real API
    // uses a different status or a body flag for this, adjust here —
    // this is the single choke point every protected call runs through.
    this.isSessionExpired = status === 401;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(message, res.status);
  }

  // handle empty responses (e.g. 204 on some PATCH endpoints)
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
};
```

This is the *single lowest-level place* in the whole app that ever calls
`fetch()`. No component, hook, or page ever calls `fetch` directly — they
all go through `api.get`/`api.post`/`api.patch`. That centralization is the
whole point of this file:

- **`BASE_URL`** reads from an environment variable (`VITE_API_BASE_URL`,
  set in `.env`) with a hardcoded fallback. This means switching between a
  local mock API and the real deployed one is a one-line env change, not a
  find-and-replace across the codebase.
- **`ApiError`** is a custom error class that carries the HTTP status code
  along with the message. Regular JavaScript `Error` objects don't have a
  `status` field — we need one so that, further up the call chain
  (`queryClient.ts`), we can specifically detect "this failed because of a
  401" versus any other kind of failure.
- **`isSessionExpired = status === 401`** — this one boolean is what
  eventually drives the "your session expired" screen. It's computed once,
  here, so nothing else in the app needs to know that "401 means expired
  session" — that mapping lives in exactly one place.
- **`request<T>`** is a generic function — `T` is filled in by whoever calls
  it (e.g. `api.get<Applicant>(...)` says "I expect this to resolve to an
  `Applicant` object"), giving type safety on the *response* without
  duplicating the fetch logic per-endpoint.
- The **`Content-Type: application/json` and `Authorization: Bearer <token>`
  headers** are set once here — if you had to remember to add these headers
  manually every time you wanted to call the API, it would be easy to
  forget one and get a confusing 401.
- Reading the response body as **text first, then `JSON.parse`ing it only
  if non-empty**, guards against a PATCH endpoint that returns an empty
  `204 No Content` response — calling `res.json()` directly on an empty body
  throws.

---

### `src/lib/endpoints.ts`

**Path:** `/src/lib/endpoints.ts`

```ts
import { api } from './api';
import type { LoginRequest, LoginResponse } from '../types/auth';
import type {
  Applicant,
  ApplicantListParams,
  ApplicantListResponse,
  ApplicantStats,
  ApplicantStatus,
} from '../types/applicant';

export function login(credentials: LoginRequest) {
  return api.post<LoginResponse>('/auth/login', credentials);
}

export function getApplicants(params: ApplicantListParams, token: string) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  return api.get<ApplicantListResponse>(`/applicants?${query.toString()}`, token);
}

export function getApplicant(id: string, token: string) {
  return api.get<Applicant>(`/applicants/${id}`, token);
}

// Confirmed: PATCH, body field is `status`.
// Path itself wasn't visible in the docs screenshots — using the
// conventional REST shape (PATCH /applicants/:id with { status }). If the
// docs show a dedicated /applicants/:id/status path instead, this is the
// one line to change.
export function updateApplicantStatus(id: string, status: ApplicantStatus, token: string) {
  return api.patch<Applicant>(`/applicants/${id}`, { status }, token);
}

// No dedicated /stats endpoint was shown in the docs so far — computing
// summary stats client-side from the full unpaginated list is the fallback
// if one doesn't exist. Flag to confirm once you've scrolled the full
// endpoint list.
export function getStats(token: string) {
  return api.get<ApplicantStats>('/applicants/stats', token);
}
```

If `api.ts` is the generic "how to talk to any endpoint" layer, this file is
the specific "what endpoints does *this* API have" layer. Each function here
maps one API operation to one named, typed function — `login`,
`getApplicants`, `getApplicant`, `updateApplicantStatus`, `getStats`.
Nothing in `pages/` or `hooks/` ever builds a URL string by hand; they call
these functions instead. Two things worth calling out:

- **`getApplicants`'s query-string builder** loops over every key in the
  params object and only adds it to the URL if it has a real value — this
  is what lets `ApplicantListParams` have optional fields like `status: ''`
  (meaning "no filter") without literally sending `?status=` in the request.
- The comments here are intentionally left in as documentation of
  assumptions made from an incomplete view of the API docs — this is a
  realistic and honest engineering practice: write down what you're
  confident about versus what you inferred, so it's easy to fix later.

---

### `src/lib/queryClient.ts`

**Path:** `/src/lib/queryClient.ts`

```ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './api';

// AuthProvider registers itself here on mount. This lets the QueryClient
// (created once, outside the React tree) reach back into auth state
// without prop-drilling a callback through every query/mutation.
let sessionExpiredHandler: (() => void) | null = null;
export function registerSessionExpiredHandler(fn: () => void) {
  sessionExpiredHandler = fn;
}

function handleError(error: unknown) {
  if (error instanceof ApiError && error.isSessionExpired) {
    sessionExpiredHandler?.();
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // don't retry auth failures or 4xx — retrying won't fix a bad token
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
});
```

This is the "brain" of the expired-session feature. Here's the subtlety it
solves: `QueryClient` is created *once*, outside of React, before any
component (including `AuthProvider`) has even mounted. That means it can't
directly call `useAuth()`'s `handleSessionExpired` function — hooks only
work inside components. The solution is a small registration pattern:

1. This file exports a `registerSessionExpiredHandler` function and keeps a
   private `sessionExpiredHandler` variable.
2. `AuthContext.tsx` calls `registerSessionExpiredHandler(handleSessionExpired)`
   once, inside a `useEffect`, as soon as `AuthProvider` mounts.
3. From then on, **any** query or mutation anywhere in the app that fails
   with a 401 triggers `handleError`, which calls whatever function was
   registered — clearing the token and flipping the `sessionExpired` flag.

The practical effect: you never have to write "if this request fails with
401, log the user out" logic in `DashboardPage`, `ApplicantDetailPage`, or
anywhere else. It's handled once, globally, no matter which screen the
expired token is discovered on.

The `retry` function is a smaller but still important detail: by default,
TanStack Query retries failed requests up to 3 times. That's wasteful (and
slow) for a 401 or 404 — retrying with the same bad token will just fail
again 3 more times before showing an error. This function says: for any
error under 500 (client errors — bad auth, not found, etc.), don't retry at
all; only retry on 500-and-up (server errors, which *might* be transient).

---

### `src/lib/format.ts`

**Path:** `/src/lib/format.ts`

```ts
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}
```

A small, isolated utility: turns an ISO date-time string like
`"2026-07-20T14:00:00Z"` into a human-readable `"Jul 20, 2026"`, using the
browser's built-in `Intl.DateTimeFormat` (no date library needed for
something this simple). The `try/catch` is defensive — if the API ever
sends something that isn't a valid date string, the UI shows the raw string
instead of crashing.

---

### `src/context/AuthContext.tsx`

**Path:** `/src/context/AuthContext.tsx`

```tsx
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { login as loginRequest } from '../lib/endpoints';
import { ApiError } from '../lib/api';
import { registerSessionExpiredHandler } from '../lib/queryClient';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  // Called by the data layer whenever a request comes back with a 401 —
  // clears the token and flips a flag the UI can use to show "session
  // expired" instead of silently bouncing to a blank login screen.
  const handleSessionExpired = useCallback(() => {
    clearExpiryTimer();
    setToken(null);
    setUser(null);
    setSessionExpired(true);
  }, [clearExpiryTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await loginRequest({ email, password });
        setToken(res.accessToken);
        setUser(res.user);
        setSessionExpired(false);

        // Proactively expire the session client-side rather than waiting
        // for the next request to fail — expiresIn is in seconds, backed
        // off by 1s so we don't race a request that's already in flight
        // right at the boundary.
        clearExpiryTimer();
        expiryTimer.current = setTimeout(() => {
          handleSessionExpired();
        }, Math.max(res.expiresIn - 1, 0) * 1000);
      } catch (err) {
        if (err instanceof ApiError) {
          throw new Error(err.status === 401 || err.status === 400 ? 'Incorrect email or password.' : err.message);
        }
        throw err;
      }
    },
    [clearExpiryTimer, handleSessionExpired]
  );

  const logout = useCallback(() => {
    clearExpiryTimer();
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  }, [clearExpiryTimer]);

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, sessionExpired, login, logout, handleSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

This is the single source of truth for "is the user logged in, and as who."
Walking through it:

- **`createContext<AuthContextValue | undefined>(undefined)`**: React
  Context needs a default value; `undefined` is used deliberately so that
  `useAuth()` (below) can detect and error loudly if someone tries to use it
  outside of `<AuthProvider>` — better to fail immediately with a clear
  message than to silently behave incorrectly.
- **State**: `token`, `user`, and `sessionExpired` are the three pieces of
  state this context owns. `isAuthenticated` isn't separate state — it's
  *derived* (`!!token`) so it can never get out of sync with `token` itself.
- **`expiryTimer` (a `useRef`)**: holds the ID of a `setTimeout`, so it can
  be cancelled later. A `ref` is used instead of `state` because changing it
  should never itself trigger a re-render — it's bookkeeping, not something
  the UI displays.
- **`handleSessionExpired`**: the function registered with `queryClient.ts`
  (see above). Clears everything and sets `sessionExpired = true`.
- **`login`**: calls the `login` endpoint function, and on success:
  1. Stores the token and user.
  2. Clears any previous expiry timer (in case of a stale login attempt).
  3. Schedules a *new* timer using the real `expiresIn` value the API
     returned — this is what makes the app proactively show "session
     expired" the moment the token would actually go stale, rather than
     waiting for a request to fail first. The `Math.max(res.expiresIn - 1, 0)`
     backs off by one second as a small safety margin.
  4. On failure, re-throws a *friendlier* error message for 401/400 (bad
     credentials) versus anything else (network/server issue) — this is
     what `LoginPage.tsx` displays to the user.
- **`logout`**: the manual, user-initiated version of the same cleanup.
- **The two `useEffect` calls**: one registers the session-expiry handler
  once when the provider mounts; the other ensures the timer is cleaned up
  if the whole app were ever unmounted (mostly a correctness habit, since
  in this app `AuthProvider` never actually unmounts).
- **`useAuth()`**: the hook every component actually calls
  (`const { token, login } = useAuth()`), instead of importing
  `AuthContext` and calling `useContext` directly everywhere.

---

### `src/routes/ProtectedRoute.tsx`

**Path:** `/src/routes/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, sessionExpired } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ sessionExpired }} />;
  }

  return <Outlet />;
}
```

This is a *layout route* in React Router terms — it doesn't render any
visible UI of its own. Instead:
- If there's no valid token, it renders `<Navigate to="/login" />`, which
  redirects the browser. It also passes `state={{ sessionExpired }}` along
  with the redirect — this is how `LoginPage.tsx` knows to show "your
  session expired" instead of a blank login form, without needing a
  separate route or query parameter for it.
- If there *is* a token, it renders `<Outlet />`, which is React Router's
  placeholder for "whatever nested route matched." Looking back at
  `App.tsx`, everything nested inside `<Route element={<ProtectedRoute />}>`
  — the `Layout`, `DashboardPage`, `ApplicantDetailPage` — only ever renders
  if this check passes.

---

### `src/components/Layout.tsx`

**Path:** `/src/components/Layout.tsx`

```tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">INFNOVA Technologies</p>
            <h1 className="text-lg font-semibold text-ink leading-tight">Applicant Review</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-ink-muted hidden sm:inline">{user.fullName}</span>}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink border border-border rounded-md px-3 py-1.5 transition-colors"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

This is the shared shell around every authenticated page: a header with the
company name, the logged-in user's name, and a logout button, followed by a
`<main>` area where the actual page content (`<Outlet />`) renders. Any
route nested under it in `App.tsx` automatically gets this header for free —
`DashboardPage` and `ApplicantDetailPage` don't need to render their own
headers.

`handleLogout` does two things in sequence: clears the auth state (via
`logout()` from context), then explicitly navigates to `/login`. The
`{ replace: true }` option means this navigation replaces the current
browser history entry rather than adding a new one — so hitting the
browser's Back button after logging out doesn't take you back to the
now-inaccessible dashboard.

---

### `src/components/StatusBadge.tsx`

**Path:** `/src/components/StatusBadge.tsx`

```tsx
import type { ApplicantStatus } from '../types/applicant';

const STYLES: Record<ApplicantStatus, string> = {
  pending: 'text-status-pending bg-status-pending-bg border-status-pending/30',
  shortlisted: 'text-status-reviewed bg-status-reviewed-bg border-status-reviewed/30',
  accepted: 'text-status-accepted bg-status-accepted-bg border-status-accepted/30',
  rejected: 'text-status-rejected bg-status-rejected-bg border-status-rejected/30',
};

const LABELS: Record<ApplicantStatus, string> = {
  pending: 'Pending',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: ApplicantStatus }) {
  return (
    <span
      className={`stamp inline-block text-[11px] font-semibold uppercase border-2 rounded px-2 py-0.5 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
```

A small, pure, reusable component — give it a `status`, it renders the
right colored badge. `Record<ApplicantStatus, string>` is a TypeScript
utility type meaning "an object with exactly one entry per possible
`ApplicantStatus` value, each mapping to a string" — if a new status were
ever added to the `ApplicantStatus` union in `types/applicant.ts` without
updating `STYLES` and `LABELS` here, TypeScript would refuse to compile
until you did, which prevents a whole category of "forgot to handle the new
status" bugs. The `stamp` class is the custom CSS defined back in
`index.css`.

---

### `src/hooks/useDebouncedValue.ts`

**Path:** `/src/hooks/useDebouncedValue.ts`

```ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

A generic debounce hook. "Debouncing" means: wait until the value stops
changing for a bit before actually reacting to it. Without this, every
single keystroke in the search box would trigger a new API request — typing
"jade" would fire 4 requests (`j`, `ja`, `jad`, `jade`) instead of 1. Here's
how it works: every time `value` changes, it starts a 350ms timer to update
`debounced`; but if `value` changes *again* before that timer fires, the
cleanup function (`clearTimeout(timer)`) cancels the old timer before
starting a new one. `debounced` only actually updates once typing pauses for
350ms.

---

### `src/hooks/useApplicantListParams.ts`

**Path:** `/src/hooks/useApplicantListParams.ts`

```ts
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { ApplicantListParams, ApplicantStatus, ApplicantTrack, ExperienceLevel } from '../types/applicant';

const DEFAULT_LIMIT = 10;

export function useApplicantListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ApplicantListParams = useMemo(
    () => ({
      page: Number(searchParams.get('page') ?? '1'),
      limit: Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)),
      search: searchParams.get('search') ?? '',
      status: (searchParams.get('status') ?? '') as ApplicantStatus | '',
      track: (searchParams.get('track') ?? '') as ApplicantTrack | '',
      experienceLevel: (searchParams.get('experienceLevel') ?? '') as ExperienceLevel | '',
      sortBy: searchParams.get('sortBy') ?? 'applicationDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    }),
    [searchParams]
  );

  // Any filter change resets to page 1 unless the caller is explicitly
  // changing the page itself — otherwise you can end up on page 4 of a
  // filtered set that only has 1 page.
  const updateParams = useCallback(
    (patch: Partial<ApplicantListParams>) => {
      const next = new URLSearchParams(searchParams);
      const isPageChange = 'page' in patch && Object.keys(patch).length === 1;

      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      if (!isPageChange) {
        next.delete('page');
      }

      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  return { params, updateParams };
}
```

This is one of the more subtle architectural decisions in the project: list
filters (search text, status, track, sort order, current page) are stored
in the **URL's query string**, not in local component state. Why that
matters:

- The URL becomes shareable and bookmarkable — you can copy a link to
  "page 2, status=pending, sorted by name" and send it to someone.
- Refreshing the browser doesn't reset your filters.
- The browser's Back/Forward buttons naturally step through filter changes.

`useSearchParams()` (from React Router) is the primitive that reads/writes
the URL's `?key=value` pairs. This hook wraps it with two conveniences:

- **`params`**: reads the current URL and turns it into a properly-typed
  `ApplicantListParams` object, filling in sensible defaults (`page: 1`,
  `limit: 10`, `sortBy: 'applicationDate'`, `sortOrder: 'desc'`) for
  anything not present in the URL yet.
- **`updateParams(patch)`**: takes a partial update (e.g.
  `{ status: 'pending' }`) and merges it into the URL. The one bit of real
  logic here: changing any filter *other than* page number resets `page`
  back to being unset (which `params` then reads as page 1) — this stops
  you from, say, filtering down to 2 results while sitting on page 5 and
  seeing an empty screen.

---

### `src/hooks/useApplicants.ts`

**Path:** `/src/hooks/useApplicants.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getApplicants, getApplicant, updateApplicantStatus } from '../lib/endpoints';
import type { ApplicantListParams, ApplicantStatus } from '../types/applicant';
import { useAuth } from '../context/AuthContext';

export function useApplicants(params: ApplicantListParams) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['applicants', params],
    queryFn: () => getApplicants(params, token!),
    enabled: !!token,
    placeholderData: (prev) => prev, // keep old page visible while the next page loads
  });
}

export function useApplicant(id: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => getApplicant(id!, token!),
    enabled: !!token && !!id,
  });
}

export function useUpdateApplicantStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicantStatus }) =>
      updateApplicantStatus(id, status, token!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['applicant', variables.id] });
      toast.success('Status updated.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not update status.');
    },
  });
}
```

This file is where TanStack Query connects to our specific data. Three
hooks:

- **`useApplicants(params)`**: fetches the list. The `queryKey: ['applicants',
  params]` is important — TanStack Query caches results *per unique key*,
  so `['applicants', { page: 1, status: 'pending' }]` and `['applicants',
  { page: 2, status: 'pending' }]` are cached separately and automatically
  refetched whenever `params` changes (because React re-runs the hook with
  a new `params` object whenever the URL changes, thanks to
  `useApplicantListParams`). `enabled: !!token` stops it from firing before
  we're logged in. `placeholderData: (prev) => prev` is what keeps the
  *previous* page's data visible (rather than flashing to a blank loading
  state) while a new page loads — that's why `DashboardPage.tsx` dims the
  table with `opacity-60` during `isFetching` instead of swapping to a full
  skeleton.
- **`useApplicant(id)`**: fetches one applicant's full detail, only once we
  have both a token and an `id` from the URL.
- **`useUpdateApplicantStatus()`**: a *mutation* (TanStack Query's term for
  a write operation, as opposed to a read/`query`). On success, it does two
  things: `invalidateQueries` for both the list and the specific detail
  query, which tells TanStack Query "these are now stale, refetch them next
  time they're used" — this is how updating a status on the detail page
  automatically reflects in the list table the next time you go back to it,
  without any manual state syncing. It also fires a success toast. On
  failure, it fires an error toast instead.

---

### `src/components/ApplicantFilters.tsx`

**Path:** `/src/components/ApplicantFilters.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { ApplicantListParams } from '../types/applicant';
import { APPLICANT_STATUSES, APPLICANT_TRACKS, EXPERIENCE_LEVELS } from '../types/applicant';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface Props {
  params: ApplicantListParams;
  onChange: (patch: Partial<ApplicantListParams>) => void;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'applicationDate', label: 'Application date' },
  { value: 'fullName', label: 'Name' },
];

export function ApplicantFilters({ params, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(params.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    if (debouncedSearch !== (params.search ?? '')) {
      onChange({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const selectClass =
    'text-sm border border-border rounded-md px-2.5 py-2 bg-surface text-ink focus:border-accent focus:ring-1 focus:ring-accent outline-none';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-2 bg-surface text-ink focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
      </div>

      <select
        value={params.status ?? ''}
        onChange={(e) => onChange({ status: e.target.value as ApplicantListParams['status'] })}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {APPLICANT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={params.track ?? ''}
        onChange={(e) => onChange({ track: e.target.value as ApplicantListParams['track'] })}
        className={selectClass}
        aria-label="Filter by track"
      >
        <option value="">All tracks</option>
        {APPLICANT_TRACKS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={params.experienceLevel ?? ''}
        onChange={(e) => onChange({ experienceLevel: e.target.value as ApplicantListParams['experienceLevel'] })}
        className={selectClass}
        aria-label="Filter by experience level"
      >
        <option value="">All levels</option>
        {EXPERIENCE_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l[0].toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={`${params.sortBy}:${params.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':');
          onChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
        }}
        className={selectClass}
        aria-label="Sort applicants"
      >
        {SORT_OPTIONS.flatMap((opt) => [
          <option key={`${opt.value}:desc`} value={`${opt.value}:desc`}>
            {opt.label} (newest/Z–A)
          </option>,
          <option key={`${opt.value}:asc`} value={`${opt.value}:asc`}>
            {opt.label} (oldest/A–Z)
          </option>,
        ])}
      </select>
    </div>
  );
}
```

This renders the search box and the three filter dropdowns plus the sort
dropdown. A few things worth explaining:

- **Why there's local `searchInput` state *and* the debounced value**: if
  the `<input>`'s `value` were bound directly to `params.search` (which
  lives in the URL), every keystroke would immediately rewrite the URL and
  trigger a new API request — exactly what `useDebouncedValue` is meant to
  prevent. Instead, `searchInput` is fast local state that updates
  instantly (so typing feels responsive), and only the *debounced* version
  of it gets pushed up into the URL/API call via `onChange({ search:
  debouncedSearch })`.
- **The status/track/experience dropdowns** are all built the same way: map
  over the shared constant arrays from `types/applicant.ts` (`APPLICANT_STATUSES`,
  etc.) to generate `<option>` elements, so adding a new status/track value
  anywhere in the app only requires editing one array.
- **The sort dropdown** combines two separate concerns (which field to sort
  by, and which direction) into one `<select>` by encoding both into a
  single string like `"applicationDate:desc"`, then splitting it back apart
  on change. This was a simpler UI than two separate dropdowns for a small
  filter bar.
- **`onChange` here isn't a native DOM event handler** — it's the
  `updateParams` function passed down from `DashboardPage`, renamed to
  `onChange` in this component's own `Props` interface. This is a common
  React pattern: a child component doesn't need to know *where* state
  lives, only that calling a given callback prop updates it.

---

### `src/components/ApplicantTable.tsx`

**Path:** `/src/components/ApplicantTable.tsx`

```tsx
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ApplicantSummary } from '../types/applicant';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../lib/format';

export function ApplicantTable({ applicants }: { applicants: ApplicantSummary[] }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      {/* Desktop table */}
      <table className="w-full text-sm hidden sm:table">
        <thead>
          <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Track</th>
            <th className="px-4 py-2.5 font-medium">Country</th>
            <th className="px-4 py-2.5 font-medium">Applied</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-accent-soft/40 transition-colors">
              <td className="px-4 py-3">
                <Link to={`/applicants/${a.id}`} className="font-medium text-ink hover:text-accent">
                  {a.fullName}
                </Link>
                <p className="text-ink-muted text-xs">{a.email}</p>
              </td>
              <td className="px-4 py-3 text-ink-muted capitalize">{a.track}</td>
              <td className="px-4 py-3 text-ink-muted">{a.country}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(a.applicationDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/applicants/${a.id}`} aria-label={`View ${a.fullName}`}>
                  <ChevronRight size={16} className="text-ink-muted" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {applicants.map((a) => (
          <Link
            key={a.id}
            to={`/applicants/${a.id}`}
            className="block p-4 hover:bg-accent-soft/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{a.fullName}</p>
                <p className="text-ink-muted text-xs">{a.email}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
              <span className="capitalize">{a.track}</span>
              <span>·</span>
              <span>{a.country}</span>
              <span>·</span>
              <span>{formatDate(a.applicationDate)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

This is where responsiveness (a hard requirement in the brief) is actually
solved. Rather than trying to make one `<table>` element squeeze onto a
phone screen (which usually means horizontal scrolling and tiny tap
targets), this component renders **two completely different layouts** and
uses Tailwind's responsive classes to show only one at a time:

- `hidden sm:table` — hidden by default, becomes a `<table>` display once
  the viewport is `sm` (640px) or wider.
- `sm:hidden` — the opposite: a stack of card-like `<Link>` blocks, visible
  by default, hidden once the screen is `sm` or wider.

Both branches render the same data (`applicants.map(...)`), just with
different markup — a `<table>` full of `<tr>`/`<td>` on desktop, a list of
tappable cards on mobile.

---

### `src/components/Pagination.tsx`

**Path:** `/src/components/Pagination.tsx`

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../types/applicant';

interface Props {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: Props) {
  const { page, totalPages, total, limit } = meta;
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-ink-muted">
        Showing <span className="text-ink font-medium">{start}–{end}</span> of{' '}
        <span className="text-ink font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <span className="px-2 text-ink-muted font-mono text-xs">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
```

Takes the pagination metadata from the API response (`page`, `limit`,
`total`, `totalPages`) and derives the "Showing 11–20 of 47" text plus
Previous/Next buttons that are automatically disabled at the first/last
page. `if (totalPages <= 1) return null` means the whole control disappears
entirely when there's only one page of results — no point showing
pagination controls for a list that doesn't need paging.

---

### `src/components/ApplicantListSkeleton.tsx`

**Path:** `/src/components/ApplicantListSkeleton.tsx`

```tsx
export function ApplicantListSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading applicants">
      <div className="hidden sm:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
            <div className="h-3.5 bg-border rounded w-32" />
            <div className="h-3.5 bg-border rounded w-40" />
            <div className="h-3.5 bg-border rounded w-20" />
            <div className="h-5 bg-border rounded w-24 ml-auto" />
          </div>
        ))}
      </div>
      <div className="sm:hidden divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="h-4 bg-border rounded w-2/3" />
            <div className="h-3 bg-border rounded w-1/2" />
            <div className="h-5 bg-border rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

The dedicated **loading state** required by the brief. `Array.from({ length: 6
}).map(...)` is a common trick to render a fixed number of placeholder
rows without needing real data — it creates an array of 6 `undefined`
values just to iterate over. Each placeholder is a plain gray `<div>` sized
roughly like the real content it's standing in for, and `animate-pulse` (a
built-in Tailwind utility) fades their opacity in and out to visually signal
"this is loading, not actually blank." `aria-busy="true"` is an
accessibility hint for screen readers.

---

### `src/components/ApplicantListStates.tsx`

**Path:** `/src/components/ApplicantListStates.tsx`

```tsx
import { Inbox, TriangleAlert } from 'lucide-react';

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 flex flex-col items-center text-center px-4">
      <Inbox size={28} className="text-ink-muted mb-3" />
      <p className="text-ink font-medium">No applicants found</p>
      <p className="text-ink-muted text-sm mt-1 max-w-sm">
        {hasFilters
          ? 'No one matches these filters. Try widening your search or clearing a filter.'
          : 'Applicants will show up here once they apply.'}
      </p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-status-rejected/30 bg-status-rejected-bg rounded-lg py-16 flex flex-col items-center text-center px-4">
      <TriangleAlert size={28} className="text-status-rejected mb-3" />
      <p className="text-ink font-medium">Couldn't load applicants</p>
      <p className="text-ink-muted text-sm mt-1 max-w-sm">
        Something went wrong fetching this list. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-1.5 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
```

The **empty state** and **error state** required by the brief, both in one
file since they're small and closely related.

- `EmptyState` takes a `hasFilters` prop so it can distinguish "there are
  truly zero applicants in the system" from "your current filters happen to
  match nobody" — different messages for genuinely different situations.
- `ErrorState` takes an `onRetry` callback, wired up in `DashboardPage.tsx`
  to TanStack Query's own `refetch()` function, so the Retry button
  actually re-runs the failed request rather than requiring a full page
  reload.

---

### `src/pages/LoginPage.tsx`

**Path:** `/src/pages/LoginPage.tsx`

```tsx
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const sessionExpired = (location.state as { sessionExpired?: boolean } | null)?.sessionExpired;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: 'admin@infnova.tech', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase mb-2">INFNOVA Technologies</p>
          <h1 className="text-2xl font-semibold text-ink">Applicant Review</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4"
        >
          {sessionExpired && (
            <div className="text-sm bg-status-pending-bg text-status-pending border border-status-pending/30 rounded-md px-3 py-2">
              Your session expired. Please log in again.
            </div>
          )}
          {formError && (
            <div className="text-sm bg-status-rejected-bg text-status-rejected border border-status-rejected/30 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-xs text-status-rejected mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-xs text-status-rejected mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md py-2 transition-colors disabled:opacity-60"
          >
            <LogIn size={16} />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

This is React Hook Form in action:

- **`useForm<LoginFormValues>({ defaultValues: {...} })`** creates the form
  instance, pre-filled with the challenge's known admin email so it's one
  less thing to type during a demo.
- **`register('email', { required: 'Email is required' })`** is React Hook
  Form's core API: spreading `{...register('email', ...)}` onto an
  `<input>` wires up its value, onChange, and validation *without* you
  writing `useState` + `onChange` handlers by hand, and without triggering
  a re-render of the whole form on every keystroke (React Hook Form uses
  uncontrolled inputs internally, tracked via refs).
- **`formState: { errors, isSubmitting }`** gives you validation errors per
  field, and a boolean that's `true` while the async `onSubmit` is running
  — used here to disable the submit button and show "Signing in…" so users
  can't double-submit.
- **`onSubmit`** calls `login()` from `AuthContext`. On success, it
  navigates to `/` (the dashboard). On failure, it catches the friendly
  error message thrown by `AuthContext.login` (see above) and displays it.
- **`location.state?.sessionExpired`**: reads the flag that
  `ProtectedRoute.tsx` passed along when redirecting here, to conditionally
  show the "your session expired" banner — this is the piece that makes the
  expired-session state a real, distinct screen rather than a silent bounce.

---

### `src/pages/DashboardPage.tsx`

**Path:** `/src/pages/DashboardPage.tsx`

```tsx
import { useApplicantListParams } from '../hooks/useApplicantListParams';
import { useApplicants } from '../hooks/useApplicants';
import { ApplicantFilters } from '../components/ApplicantFilters';
import { ApplicantTable } from '../components/ApplicantTable';
import { Pagination } from '../components/Pagination';
import { ApplicantListSkeleton } from '../components/ApplicantListSkeleton';
import { EmptyState, ErrorState } from '../components/ApplicantListStates';

export function DashboardPage() {
  const { params, updateParams } = useApplicantListParams();
  const { data, isLoading, isError, refetch, isFetching } = useApplicants(params);

  const hasFilters = !!(params.search || params.status || params.track || params.experienceLevel);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-ink">Applicants</h2>
        <p className="text-ink-muted text-sm mt-0.5">
          {data ? `${data.meta.total} total applicant${data.meta.total === 1 ? '' : 's'}` : 'Review and manage internship applications'}
        </p>
      </div>

      <ApplicantFilters params={params} onChange={updateParams} />

      {isLoading ? (
        <ApplicantListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : data ? (
        <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
          <ApplicantTable applicants={data.data} />
          <Pagination meta={data.meta} onPageChange={(page) => updateParams({ page })} />
        </div>
      ) : null}
    </div>
  );
}
```

This is the page that composes everything above it into the actual
dashboard screen. Notice how little *logic* is in this file — almost all of
it is either a hook (`useApplicantListParams`, `useApplicants`) or a
component (`ApplicantFilters`, `ApplicantTable`, etc.). This is deliberate:
`DashboardPage` is essentially glue code, wiring the URL-backed filter state
into the data-fetching hook, and then choosing which of five branches to
render based on the query's state:

1. `isLoading` → skeleton
2. `isError` → error state, with retry wired to `refetch()`
3. loaded but zero results → empty state
4. loaded with results → the real table + pagination
5. (fallback) `null`, for the brief instant before any of the above is true

This if/else-if chain is what implements all four required UI states in one
place, driven entirely by TanStack Query's own status flags.

---

### `src/pages/ApplicantDetailPage.tsx`

**Path:** `/src/pages/ApplicantDetailPage.tsx`

```tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Code2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useApplicant, useUpdateApplicantStatus } from '../hooks/useApplicants';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/format';
import { APPLICANT_STATUSES, type ApplicantStatus } from '../types/applicant';
import { ErrorState } from '../components/ApplicantListStates';

export function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: applicant, isLoading, isError, refetch } = useApplicant(id);
  const updateStatus = useUpdateApplicantStatus();

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4">
        <ArrowLeft size={14} />
        Back to applicants
      </Link>

      {isLoading ? (
        <div className="border border-border rounded-lg p-6 bg-surface animate-pulse space-y-3">
          <div className="h-5 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="h-4 bg-border rounded w-2/3" />
        </div>
      ) : isError || !applicant ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="border border-border rounded-lg bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-ink">{applicant.fullName}</h2>
              <p className="text-ink-muted text-sm capitalize mt-0.5">
                {applicant.track} · {applicant.experienceLevel} · Applied {formatDate(applicant.applicationDate)}
              </p>
            </div>
            <StatusBadge status={applicant.status} />
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6">
            <p className="flex items-center gap-2 text-ink-muted">
              <Mail size={14} /> {applicant.email}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Phone size={14} /> {applicant.phoneNumber}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Globe size={14} /> {applicant.country}
            </p>
          </div>

          {applicant.skills?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {applicant.skills.map((skill) => (
                  <span key={skill} className="text-xs bg-accent-soft text-accent rounded px-2 py-0.5">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {applicant.motivation && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-1.5">Motivation</p>
              <p className="text-sm text-ink leading-relaxed">{applicant.motivation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-6 text-sm">
            {applicant.portfolioUrl && (
              <a
                href={applicant.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <ExternalLink size={13} /> Portfolio
              </a>
            )}
            {applicant.githubUrl && (
              <a
                href={applicant.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <Code2 size={13} /> GitHub
              </a>
            )}
            {applicant.linkedInUrl && (
              <a
                href={applicant.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <LinkIcon size={13} /> LinkedIn
              </a>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-2">Update status</p>
            <div className="flex flex-wrap gap-2">
              {APPLICANT_STATUSES.map((status) => (
                <button
                  key={status}
                  disabled={updateStatus.isPending || applicant.status === status}
                  onClick={() => id && updateStatus.mutate({ id, status: status as ApplicantStatus })}
                  className="text-xs font-medium border border-border rounded-md px-3 py-1.5 capitalize hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

The detail screen, following the same pattern as the dashboard: `useParams<{
id: string }>()` reads the `:id` segment out of the URL (matching the route
`/applicants/:id` defined in `App.tsx`), feeds it into `useApplicant(id)`,
and branches on loading/error/loaded exactly like `DashboardPage` did.

The status-update section at the bottom renders one button per possible
status (looping over `APPLICANT_STATUSES`, the same shared constant used in
the filter dropdown). Each button:
- Is disabled if a mutation is already in flight (`updateStatus.isPending`)
  or if it's already the applicant's current status (no point letting
  someone "update" pending to pending).
- On click, calls `updateStatus.mutate({ id, status })` — this is the
  mutation hook from `useApplicants.ts`, which on success invalidates both
  the detail and list queries so everything stays in sync, and shows a
  toast either way.

---

## 4. THE CONFIGURATION FILES

### `package.json`

```json
{
  "name": "infnova-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.101.2",
    "lucide-react": "^1.25.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-hook-form": "^7.82.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.18.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@tanstack/react-query-devtools": "^5.101.2",
    "@types/node": "^24.13.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.7.0",
    "oxlint": "^1.71.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^5.4.21"
  }
}
```

- **`"type": "module"`**: tells Node.js to treat `.js` files in this project
  as native ES modules (`import`/`export`) rather than the older CommonJS
  (`require`) — this is standard for any modern Vite project.
- **`scripts`**:
  - `dev` starts the Vite dev server (hot-reloading, instant feedback).
  - `build` runs `tsc -b` (TypeScript's build mode, which type-checks the
    whole project using the `tsconfig` project references) *then* `vite
    build`, which bundles everything into static files in `dist/`. If
    `tsc -b` fails (a type error anywhere), the build stops before Vite
    even runs — you can't accidentally ship code that doesn't type-check.
  - `lint` runs `oxlint`, a fast Rust-based linter (an alternative to
    ESLint) that Vite's `react-ts` template sets up by default.
  - `preview` serves the production build locally, so you can sanity-check
    what will actually get deployed before pushing it.
- **`dependencies`** vs **`devDependencies`**: dependencies are code that
  ends up *inside* the shipped app (React itself, React Router, TanStack
  Query, etc.). devDependencies are tools only needed while *developing* the
  app (Vite, TypeScript, Tailwind's build plugin, the linter) — they never
  ship to the browser.
- The `^` prefix on version numbers (e.g. `^5.101.2`) means "this version or
  any newer compatible version" (compatible = same major version number).
  This is why running `npm install` fresh might pull slightly newer patch
  versions than the exact ones listed here — that's expected and fine.

### `package-lock.json`

Not something you edit by hand. When you run `npm install`, npm resolves
every dependency (and every dependency of every dependency) to one exact
version and writes it here, so that anyone else who runs `npm install`
against this exact lockfile gets byte-for-byte the same dependency tree you
had. This is what makes builds reproducible. **Important practical note:**
this file also records which OS-specific optional native binaries got
installed (relevant to a real issue hit during this build — see section 5).

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Vite's own configuration. `defineConfig` is just a helper that gives you
TypeScript autocomplete on the config object — functionally you could write
a plain object instead. Two plugins are registered:
- `react()`: teaches Vite how to compile `.tsx`/`.jsx` files (JSX syntax
  isn't valid JavaScript on its own — it needs to be transformed).
- `tailwindcss()`: this is Tailwind v4's new integration method. In
  Tailwind v3 and earlier, you'd have a separate `tailwind.config.js` plus
  PostCSS configuration; v4 replaced that with this single Vite plugin,
  which scans your source files for class names and generates only the CSS
  actually used, and reads the `@theme` block from `index.css` (shown in
  section 3) for design tokens instead of a JS config object.

### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

This is a "project references" setup — instead of one giant TypeScript
config, there are two specialized ones, because the code in `src/` and the
code in `vite.config.ts` run in fundamentally different environments:

- **`tsconfig.app.json`** governs everything in `src/` — the actual React
  app, which runs in a *browser*. Notice `"lib": ["ES2023", "DOM"]` (it
  needs to know about browser APIs like `document`, `fetch`, `URLSearchParams`)
  and `"jsx": "react-jsx"` (tells TypeScript how to handle JSX syntax).
- **`tsconfig.node.json`** governs `vite.config.ts` itself, which runs in
  *Node.js* during the build, not in a browser. It uses `"types": ["node"]`
  instead of DOM types, since `vite.config.ts` has no business touching
  `document` or `window`.
- **`tsconfig.json`** (the root one) doesn't configure anything itself —
  `"files": []` means it applies to no files directly. It just references
  the other two, which is what lets you run a single `tsc -b` command (as
  `package.json`'s `build` script does) and have it correctly type-check
  both halves of the project with their appropriate, different rules.
- A few individual options worth knowing: `"noUnusedLocals"` and
  `"noUnusedParameters"` make TypeScript error on dead code (a variable you
  declared but never used) — this is what would have caught, for example,
  an unused import left behind after refactoring. `"moduleResolution":
  "bundler"` tells TypeScript to resolve imports the same way Vite's bundler
  does, which is what allows import paths like `'./lib/api'` (no `.ts`
  extension) to work correctly.

### `.env` and `.env.example`

```
VITE_API_BASE_URL=https://infnova-intern.vercel.app/api
```

Both files contain the same one line in this project. The distinction:
`.env` is the file Vite actually reads at build/dev time (and is listed in
`.gitignore`, so it's never committed — the convention is that `.env` can
hold secrets specific to your machine); `.env.example` *is* committed, and
exists purely as documentation so that anyone cloning the repo (like a
reviewer at INFNOVA) knows exactly what environment variable they need to
set and what it should look like, without you ever needing to share your
own actual `.env` contents. Vite only exposes environment variables to
your app code if they're prefixed with `VITE_` — this is a deliberate
security boundary, so you can't accidentally leak a server-only secret into
client-side JavaScript just by having it in a `.env` file.

### `.gitignore`

```
node_modules
dist
.env
.env.local
*.log
```

Tells Git which files/folders to never track:
- `node_modules` — installed dependencies; enormous (hundreds of MB) and
  fully reproducible from `package.json` + `package-lock.json`, so there's
  no reason to commit it.
- `dist` — the generated production build output; also fully reproducible
  (by running `npm run build`), so it doesn't belong in version control
  either.
- `.env` / `.env.local` — machine-specific configuration/secrets.
- `*.log` — any stray log files.

### `.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

Configuration for `oxlint`, the linter run by `npm run lint`. This was
generated automatically by the Vite `react-ts` template and left as-is —
`react/rules-of-hooks` enforces React's rule that hooks (`useState`,
`useEffect`, etc.) can only be called at the top level of a component or
another hook, never conditionally or inside loops (a rule this project's
hooks all follow, e.g. `useApplicants.ts`).

### `public/` folder contents

`public/favicon.svg` and `public/icons.svg` are the default assets that
ship with Vite's `react-ts` template (a generic icon and a small sprite
sheet). Anything placed directly in `public/` is copied as-is into the
final build output, referenced by an absolute path like `/favicon.svg` —
that's why `index.html` links to `href="/favicon.svg"` without any import
statement. These were left untouched in this project since a custom favicon
wasn't part of the brief; you could safely swap `favicon.svg` for a custom
one designed for INFNOVA later.

---

## 5. STEP-BY-STEP REPLICATION GUIDE

Here is the exact chronological sequence to go from an empty folder to this
project. Run these in a terminal, one block at a time.

### Step 1 — Scaffold the project

```bash
npm create vite@latest infnova-dashboard -- --template react-ts
cd infnova-dashboard
npm install
```

This generates the base Vite+React+TypeScript app and installs its two
starting dependencies (`react`, `react-dom`) plus dev tooling (`vite`,
`@vitejs/plugin-react`, `typescript`, `oxlint`).

> **Important — a real issue hit while building this, and how to avoid
> it:** newer versions of Vite (v6 and up) can default to an experimental
> Rolldown-based bundler, which ships separate native binary packages per
> operating system (e.g. `@rolldown/binding-win32-x64-msvc` for Windows).
> There's a known npm bug (npm/cli#4828) where these platform-specific
> optional dependencies sometimes don't install correctly, producing an
> error like `Cannot find native binding` the first time you run `npm run
> dev`. To avoid this entirely, pin Vite to the stable, non-Rolldown 5.x
> line right after scaffolding:
> ```bash
> npm install -D vite@^5.4.11 @vitejs/plugin-react@^4.3.4
> ```
> If you ever do hit that native-binding error anyway (e.g. because a
> lockfile was generated on a different OS than yours), the fix is:
> ```bash
> rm -rf node_modules package-lock.json   # or Remove-Item on Windows
> npm install
> ```

### Step 2 — Install the rest of the stack

```bash
npm install react-router-dom @tanstack/react-query react-hook-form lucide-react react-hot-toast
npm install -D tailwindcss @tailwindcss/vite @tanstack/react-query-devtools
```

This adds every runtime dependency (routing, data fetching, forms, icons,
toasts) and Tailwind's build-time tooling.

### Step 3 — Wire up Tailwind

Edit `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace the entire contents of `src/index.css` with the full file shown in
section 3 above (the `@import` + `@theme` block). Delete the
auto-generated `src/App.css` — it's not used.

> Watch the `@import` order: any `@import url(...)` for external resources
> (like the Google Fonts link) must come *before* `@import "tailwindcss"`,
> or the build emits a CSS warning about import ordering.

### Step 4 — Set up folders

```bash
mkdir -p src/lib src/types src/context src/hooks src/components src/pages src/routes
```

### Step 5 — Environment variables

```bash
echo "VITE_API_BASE_URL=https://infnova-intern.vercel.app/api" > .env.example
echo "VITE_API_BASE_URL=https://infnova-intern.vercel.app/api" > .env
```

### Step 6 — Types first

Create, in this order (each only depends on the ones before it):
1. `src/types/auth.ts`
2. `src/types/applicant.ts`

(Full contents in section 3.) Types come first because every other file —
the API client, the hooks, the components — imports from these.

### Step 7 — The API layer

Create, in this order:
1. `src/lib/api.ts` — the generic fetch wrapper.
2. `src/lib/endpoints.ts` — the typed functions per endpoint (imports from
   `api.ts` and the type files).
3. `src/lib/format.ts` — small date formatter, no dependencies.

### Step 8 — Auth

Create, in this order:
1. `src/lib/queryClient.ts` — needs to exist before `AuthContext` because
   `AuthContext` imports `registerSessionExpiredHandler` from it.
2. `src/context/AuthContext.tsx`
3. `src/routes/ProtectedRoute.tsx`

### Step 9 — Shared UI shell

1. `src/components/Layout.tsx`
2. `src/components/StatusBadge.tsx`

### Step 10 — App root and first page

1. `src/pages/LoginPage.tsx`
2. `src/pages/DashboardPage.tsx` (start with a placeholder body — you'll
   flesh it out once the list-fetching pieces exist in Step 12)
3. `src/App.tsx` — wires providers + routes together.
4. `src/main.tsx` — should already exist from scaffolding; no changes
   needed.

At this point, run `npm run dev` and confirm the login page renders and
routing redirects work (visiting `/` while logged out should bounce to
`/login`).

### Step 11 — Data-fetching hooks

1. `src/hooks/useDebouncedValue.ts` — no dependencies on the rest of the
   app.
2. `src/hooks/useApplicantListParams.ts` — depends on `types/applicant.ts`.
3. `src/hooks/useApplicants.ts` — depends on `lib/endpoints.ts`,
   `context/AuthContext.tsx`.

### Step 12 — List UI components

Build these in order, since later ones depend on earlier ones:
1. `src/components/ApplicantFilters.tsx`
2. `src/components/ApplicantTable.tsx`
3. `src/components/Pagination.tsx`
4. `src/components/ApplicantListSkeleton.tsx`
5. `src/components/ApplicantListStates.tsx`

Then rewrite `src/pages/DashboardPage.tsx` to its full version from section
3, composing all five of the above.

### Step 13 — Detail page

1. `src/pages/ApplicantDetailPage.tsx`
2. Add the route in `src/App.tsx`:
   ```tsx
   <Route path="/applicants/:id" element={<ApplicantDetailPage />} />
   ```
   nested inside the same `<Layout />` route as the dashboard.

### Step 14 — Verify

```bash
npx tsc -b        # confirms there are zero type errors
npm run build     # confirms the production build succeeds
npm run dev       # manually click through: login, filters, pagination,
                   # opening an applicant, changing their status, logout
```

### Step 15 — Deploy

Push the repository to GitHub, then either import it in the Vercel
dashboard or use the CLI:

```bash
npm install -g vercel
vercel
```

Set `VITE_API_BASE_URL` as an environment variable in the Vercel project
settings too — `.env` is gitignored, so Vercel never sees it unless you
configure it there separately.

---

## A note on the parts that are still assumptions

A few pieces of this project were built from an *incomplete* view of the
API's documentation (the `/api/docs` page wasn't reachable from the
sandbox this was built in), and are flagged with `// TODO` or explanatory
comments directly in the code:

- The exact path for the status-update endpoint (assumed `PATCH
  /applicants/:id` rather than a dedicated `/applicants/:id/status`).
- The exact shape of the `meta` object in the paginated list response
  (assumed `{ page, limit, total, totalPages }`).
- Whether a dedicated `/applicants/stats` endpoint exists at all.

Before your final submission, it's worth confirming these three directly
against the live `/api/docs` page and adjusting `src/lib/endpoints.ts` /
`src/types/applicant.ts` if anything differs — everything else in the app
reads through those two files, so a mismatch there is a one- or two-line
fix, not a rewrite.
