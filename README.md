*This project has been created as part of the 42 curriculum by aelsayed, iboutadg, mchetoui, wtoumi.*

---

# ft_transcendence — Modular Synth Platform

## Description

A full-stack web platform for learning, creating, and sharing modular synthesizer patches in the browser. Users register, log in, manage synth projects, interact with a community feed, and collaborate via a real-time messaging and friends system.

**Key features:**

- User authentication with JWT, email verification, and TOTP-based two-factor authentication
- OAuth2 login via Google, and 42 (intra)
- Modular synthesizer editor — create/save/share/vote on synth patches
- Community projects feed with voting and search
- Friends system with friend requests, messaging, blocking, and notifications
- User profiles with avatars
- Admin panel for user and log management
- Embedded analytics dashboard powered by Metabase (per-user usage stats)
- Observability stack: ELK (Elasticsearch, Logstash, Kibana, Filebeat, Metricbeat) for log and metric shipping
- Internationalization (i18n) support across EN, FR, AR, DE, ES

---

## Team Information

| Login | Role | Responsibilities |
|---|---|---|
| aelsayed | Technical Lead | Defines the technical architecture, chooses the technology stack, ensures code quality and best practices, and reviews critical code changes. |
| iboutadg | Product Owner | Manages the product backlog, prioritizes features, validates completed work, and communicates with stakeholders. |
| mchetoui | Project Manager | Coordinates team planning, tracks progress and deadlines, ensures communication, and resolves risks and blockers. |
| wtoumi | Developer | Develops assigned features, participates in code reviews, tests implementations, and documents completed work. |

---

## Project Management

- **Task distribution:** Work was split into features and tracked via GitHub Issues. Each issue was assigned to a team member.
- **Meetings:** Regular sync meetings held over Discord voice channels.
- **Tools:** GitHub Issues (task tracking), GitHub Projects (board view), Discord (communication)
- **Communication:** Discord — dedicated channels for general discussion, backend, frontend, and infra topics.

---

## Technical Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | — | Type safety |
| Vite | 7 | Dev server + bundler |
| Tailwind CSS | v4 | Utility-first styling |
| GSAP | 3 | Animations |
| OGL | — | WebGL (reserved for synth engine) |
| qrcode.react | — | TOTP QR code rendering |

No router library — all views are overlays toggled with `useState` in `App.tsx`.

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| Django | 5+ | Web framework |
| Django REST Framework | — | REST API |
| simplejwt | — | JWT auth with refresh rotation + blacklisting |
| drf-spectacular | — | OpenAPI schema + Swagger UI |
| django-prometheus | — | Metrics endpoint |
| pyotp | — | TOTP for 2FA |
| Pillow | — | Avatar image upload |

### Database
- **PostgreSQL 17** — chosen for its robustness, full ACID compliance, and native JSON field support (project config + analytics stored as `JSONField`).

### Infrastructure
- **Docker Compose** — orchestrates all services
- **nginx** — reverse proxy with TLS termination; routes external traffic to frontend, synthesizer, and backend
- **ELK Stack** — Elasticsearch, Logstash, Kibana, Filebeat, Metricbeat for log shipping and observability
- **Metabase** — embedded analytics dashboards per user

### Technical choices — justification

| Choice | Reason |
|---|---|
| JWT over sessions | Stateless; works cleanly across frontend/synthesizer/backend without shared session store |
| Overlay-based nav (no React Router) | SPA with deep URL awareness was not required; overlays are simpler and sufficient |
| PostgreSQL JSONField for project config | Synth scenes are schema-less by design; avoids over-normalizing patch data |
| ELK over Prometheus+Grafana | ELK gives full log pipeline (structured app logs + container metrics); Prometheus/Grafana remain configured but disabled |
| Metabase for dashboards | Rapid native SQL dashboards without building a custom analytics UI; JWT-signed iframes keep it secure per user |

---

## Database Schema

### Tables and relationships

```
User (AbstractUser)
  ├── is_verified: bool
  └── ── Profile (1:1)
           ├── avatar, bio, display_name, xp, level
           ├── two_factor_enabled, two_factor_secret
           ├── def_settings (JSON)
           └── friends (M2M self → through Friendship)

Friendship
  ├── sender → Profile (FK)
  ├── receiver → Profile (FK)
  ├── status: pending | accepted | blocked
  └── unique_together: (sender, receiver)

Message
  ├── sender → Profile (FK)
  ├── receiver → Profile (FK)
  ├── content (text, ≤2000 chars)
  ├── created_at
  └── read_at (nullable)

Notification
  ├── recipient → Profile (FK)
  ├── actor → Profile (FK)
  ├── type: message | friend_request
  ├── related_id
  ├── read_at (nullable)
  └── created_at

SocialAccount
  ├── provider: google | facebook | 42
  ├── provider_id
  └── user → User (FK)

Project
  ├── id (UUID PK)
  ├── name
  ├── user → User (FK)
  ├── config (JSON): {camera, modules, cables}
  ├── analytics (JSON): {session, modules, sharing}
  ├── created_at, updated_at
  └── ── ProjectVote (many per project)
           ├── user → User (FK)
           ├── vote: 1 | -1
           └── unique_together: (user, project)

Log
  ├── user → User (FK)
  ├── level: info | warning | error | debug | action
  ├── message
  ├── context (JSON)
  ├── source: frontend | backend
  └── created_at
```

---

## Features List

| Feature | Description | Team member(s) |
|---|---|---|
| Registration + email verification | Register with username/email/password; activation link sent via email | Aelsayed |
| Login + 2FA (TOTP) | JWT login with optional TOTP second factor; QR setup flow | Aelsayed |
| OAuth login | Google and 42 via popup-based OAuth2 flow | Aelsayed |
| Password reset | Email-based reset link → SPA confirm page | Aelsayed |
| Profile management | Display name, bio, avatar upload (jpg/png/webp, 5MB cap) | wtoumi |
| Friends system | Send/accept/decline/cancel friend requests; +100 XP on accept | wtoumi |
| Blocking | Block/unblock users; blocks suppress profiles, messages, and public visibility | wtoumi |
| Messaging | Real-time polling chat between friends; thread list with unread counts | wtoumi |
| Notifications | In-app notifications for friend requests and messages; mark-read | wtoumi |
| Modular synth editor | Create/edit synth patches in browser; autosave via PATCH | mchetoui |
| Projects — community feed | Browse all users' projects sorted by net votes | aelsayed |
| Projects — voting | Upvote/downvote projects (+1/-1/0 change) | aelsayed |
| Projects — sharing | Share project JSON; increments share count + tracks share days | aelsayed |
| User search | Search users by username/email; add friend / message / block per row | wtoumi |
| Public profiles | View another user's profile, projects, and friendship status | aelsayed |
| Admin panel | List users, delete accounts, view per-user and global logs | iboutadg |
| Analytics dashboard | Per-user Metabase dashboard (session time, module usage, streaks, etc.) | iboutadg |
| i18n | EN / FR / AR / DE / ES; plural + React node interpolation helpers | mchetoui |
| ELK observability | App logs + container metrics shipped to Elasticsearch; visualized in Kibana | iboutadg |
| Prometheus monitoring | Collects and stores container and application metrics for performance monitoring | iboutadg |
| Grafana dashboards | Visualizes metrics and observability data through interactive dashboards and alerts | iboutadg |
---

## Modules

### IV.1 — Web

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| Framework — Frontend + Backend | Major | 2 | React 19 (frontend) + Django 5 + DRF (backend). Both are production-grade frameworks handling routing, auth, serialization, and state. | mchetoui |
| User Interaction | Major | 2 | Chat (real-time polling), profile pages, and friends system (add/accept/decline/remove/block). Meets the minimum chat + profile + friends requirement. | wtoumi |
| Custom design system | Minor | 1 | 12+ reusable components with a shared token-based design language: `StatusPill`, `Toggle`, `AvatarRing`, `PillButton`, `GlassCard`, `Kicker`, `ConstellationThumb`, `TimestampMono`, `SectionKicker`, `OverlayShell`, `Button`, `Anchor`, `ConfirmModal`. Consistent color palette (`--panel`, `--accent`, `--text`, `--sub`), typography, and glass-morphism recipe in `index.css`. | mchetoui |
| Advanced search | Minor | 1 | Project search with 400ms debounce, sort by date/name, pagination (9 per page). User search with per-row context-aware action buttons. Both backed by dedicated API endpoints. | mchetoui |

### IV.2 — Accessibility and Internationalization

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| Multiple languages (i18n) | Minor | 1 | 5 complete translations: EN, FR, AR, DE, ES. Custom `t()`, `tn()` (plural), and `richT()` (React node interpolation) helpers in `i18n.ts`. Language switcher in the UI. All user-facing text runs through the i18n system. | mchetoui |
| RTL language support | Minor | 1 | Full Arabic (AR) RTL support. Layout mirrors on language switch via `.rtl-flip` utilities and `dir` attribute propagation. Overlay and grid layouts tested in RTL mode. | mchetoui |
| Additional browser support | Minor | 1 | Verified on Brave and Chrome. All features function identically across both browsers. Known limitation: self-signed TLS certificate requires manual acceptance on first visit in both browsers. | mchetoui |

### IV.3 — User Management

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| Standard user management + authentication | Major | 2 | Profile update (display name, bio, avatar), avatar upload with defaults, friends with online-adjacent status, public profile pages. JWT auth with email verification. | aelsayed |
| Remote authentication — OAuth 2.0 | Minor | 1 | Google (implicit flow) and 42 (authorization code flow) OAuth2. Popup-based flow, token exchange on the backend, JWT pair returned to the SPA. | aelsayed |
| Advanced permissions system | Major | 2 | Admin role granted via `ADMIN_USERNAMES` env var. Admin-only endpoints: list all users, delete any user, view per-user and global logs. `IsAdminUserCustom` permission class gates all `/api/users/admin/` routes. Regular users cannot access admin views. | aelsayed |
| Two-Factor Authentication (2FA) | Minor | 1 | TOTP-based 2FA via `pyotp`. Setup flow: generate secret + QR code, verify code → enable. Login flow: password auth returns `{requires_2fa, user_id}` if enabled; client posts TOTP code to `/api/users/login/2fa-verify/` for tokens. QR rendered in-browser with `qrcode.react`. | aelsayed |

### IV.7 — DevOps

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| ELK log management | Major | 2 | Elasticsearch (single-node, xpack+TLS) stores all logs. Logstash receives Beats input on port 5044. Filebeat ships Django app logs (`app.log`) and Docker container logs to Elasticsearch. Metricbeat ships system + container metrics (CPU, mem, net, disk). Kibana visualizes at `:5601`. TLS certs provisioned by one-shot `elk-setup` service. | iboutadg |
| Prometheus + Grafana monitoring | Major | 2 | Prometheus scrapes `backend:8000/monitoring/metrics` (via `django-prometheus`) every 15s. Grafana connects to Prometheus via proxy datasource and auto-provisions a dashboard from `config/grafana/`. Config files in `config/prometheus/prometheus-config.yml` and `config/grafana/`. | iboutadg |

### IV.8 — Data and Analytics

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| Advanced analytics dashboard | Major | 2 | Metabase embedded via JWT-signed iframes, one dashboard per user. 13 native-SQL cards: Total Projects, Total Session Time, Avg Session, Streak (scalar + sparkline), Active Days heatmap (pivot dow×week, conditional formatting), Hour-of-Day, Module Usage, Projects Over Time, Upvote Velocity, Top Patches table, Total Shares, Net Votes. All cards parameterized by `user_id` (locked server-side) plus an optional `date_range` filter. Backend signs 1h JWT at `GET /api/users/dashboard-token/`; rendered in an iframe overlay in the SPA. | iboutadg |

### IV.10 — Module of choice

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| Modular Synthesizer | Major | 2 | See justification below. | mchetoui |

#### Synthesizer — justification for Major module status

**Why we chose this module:**
The modular synthesizer is the core creative artifact of the platform — it is what users are creating, sharing, and voting on. Every other feature (projects, community feed, analytics, sharing) exists to support it.

**What technical challenges it addresses:**
- Separate Vite/React application (`synthesizer` service) with its own Docker container, served at `/synthesizer` via nginx
- Patch data (modules, cables, camera) stored as a schema-less `config` JSONField in the `Project` model — flexible enough to evolve without migrations
- Autosave: 1.5s debounce on any canvas change, PATCH to `/api/projects/<uuid>/` with both `config` and `analytics` payloads
- Session analytics tracking via `sessionStorage` to survive tab refreshes; session finalized on `pagehide`/`beforeunload` via `fetch keepalive`
- Module usage analytics: per-category counts (oscillators, filters, effects, envelopes, gains, LFOs, modulators, outputs, keyboards) recomputed on every modules change
- Sharing: `POST /api/projects/<uuid>/share/` increments share count and tracks unique share days; share URL copied to clipboard from the right-click context menu
- Guest/try-it-out mode when no `?project=` param is present — full editor access without login, nothing persisted
- Auth shared with the main SPA via the same `accessToken` cookie; `synthesizer/src/api.ts` mirrors the token-refresh logic

**How it adds value:**
Without the synthesizer, the platform is a generic user/projects scaffold. The synth editor is the reason the platform exists — it contextualizes every module (auth, friends, sharing, analytics, community) around a real creative tool.

**Why it deserves Major status:**
It is a standalone full-stack feature: its own frontend app, its own API surface, its own analytics pipeline, its own Docker service, and its own routing via nginx. The scope is comparable to building a second product within the same infrastructure.

---

### Points summary

| Category | Module | Type | Points |
|---|---|---|---|
| IV.1 Web | Framework (React + Django) | Major | 2 |
| IV.1 Web | User interaction (chat + profiles + friends) | Major | 2 |
| IV.1 Web | Custom design system | Minor | 1 |
| IV.1 Web | Advanced search | Minor | 1 |
| IV.2 Accessibility | Multiple languages (5) | Minor | 1 |
| IV.2 Accessibility | RTL support (Arabic) | Minor | 1 |
| IV.2 Accessibility | Additional browser support (Brave, Chrome) | Minor | 1 |
| IV.3 User Management | Standard user management + auth | Major | 2 |
| IV.3 User Management | OAuth 2.0 (Google, 42) | Minor | 1 |
| IV.3 User Management | Advanced permissions (admin CRUD + roles) | Major | 2 |
| IV.3 User Management | 2FA (TOTP) | Minor | 1 |
| IV.7 DevOps | ELK log management | Major | 2 |
| IV.7 DevOps | Prometheus + Grafana monitoring | Major | 2 |
| IV.8 Analytics | Advanced analytics dashboard (Metabase) | Major | 2 |
| IV.10 Module of choice | Modular synthesizer | Major | 2 |
| **Total** | | | **23** |

---

## Individual Contributions

### iboutadg
- devops, analysis

### mchetoui
- front, synth

### aelsayed
- backend, synth

### wtoumi
- chat, devops, nginx

---

## Instructions

### Prerequisites

| Requirement | Notes |
|---|---|
| Docker + Docker Compose | v2+ recommended |
| 42 / Google / Facebook OAuth apps | Client IDs + secrets needed for social login |
| SMTP credentials | Optional — console backend used by default |
| 8 GB RAM | ELK stack is memory-intensive |

### Environment setup

Copy or create a `.env` file at the repo root. Required variables:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=trandandan

# Django
SECRET_KEY=your-secret-key-here

# OAuth (42 is required for code exchange; Google/Facebook are frontend-only)
FORTYTWO_CLIENT_ID=
FORTYTWO_CLIENT_SECRET=
FORTYTWO_REDIRECT_URI=https://localhost:8443/auth-callback.html
VITE_FORTYTWO_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_CLIENT_ID=

# Synthesizer
VITE_SYNTHESIZER_URL=https://localhost:8443/synthesizer

# Admin
ADMIN_USERNAMES=your_admin_username

# Email (optional — defaults to console backend)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=

# ELK Stack
STACK_VERSION=8.15.0
ELASTIC_PASSWORD=changeme
KIBANA_PASSWORD=changeme
CLUSTER_NAME=my-cluster
LICENSE=basic
ES_PORT=9200
KIBANA_PORT=5601
ES_MEM_LIMIT=1073741824
KB_MEM_LIMIT=1073741824
ENCRYPTION_KEY=a-random-32-character-string-here

# Metabase
MB_EMBEDDING_SECRET_KEY=your-metabase-embedding-key
MB_PUBLIC_URL=https://localhost:3004
MB_ADMIN_EMAIL=admin@example.com
MB_ADMIN_PASS=adminpassword
VITE_METABASE_URL=https://localhost:3004
```

### Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-dir>

# 2. Create .env (see above)

# 3. Start all services
docker compose up --build

# 4. Access the app
#    Frontend:   https://localhost:8443
#    API docs:   https://localhost:8443/api/docs/
#    Kibana:     http://localhost:5601
#    Metabase:   http://localhost:3004
#    prometheus  http://localhost:3002
#    grafana     http://localhost:3003
```

> **TLS note:** nginx uses a self-signed cert by default. Accept the browser warning on first visit.

### Run backend tests

```bash
docker compose exec backend pytest
```

### Run frontend tests

```bash
docker compose exec frontend npm run test
```

### Seed test users

```bash
docker compose exec backend python create_test_users.py
```

This creates 8 users with predefined friendships and randomized social links.

---

## Resources

### Documentation
- [Django REST Framework](https://www.django-rest-framework.org/)
- [simplejwt docs](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React 19 docs](https://react.dev/)
- [Vite docs](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [GSAP docs](https://gsap.com/docs/)
- [pyotp — TOTP in Python](https://github.com/pyauth/pyotp)
- [Elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Metabase embedding docs](https://www.metabase.com/docs/latest/embedding/introduction.html)
- [OAuth 2.0 spec](https://oauth.net/2/)
- [Web audio api](https://www.w3.org/TR/webaudio-1.1/)

### AI usage

**Claude (Anthropic)** was used throughout this project for:

- **Architecture decisions** — token refresh strategy, overlay navigation pattern, ELK pipeline wiring
- **Backend code** — endpoint scaffolding, serializer logic, JWT + 2FA flows, friendship/blocking logic
- **Frontend code** — overlay component structure, `authFetch` wrapper, polling logic for chat and notifications
- **Debugging** — diagnosing nginx proxy misconfiguration, Docker networking issues, avatar URL absolutization bug
- **Infrastructure** — Docker Compose service dependencies, ELK TLS cert provisioning, Metabase init script
- **Tests** — backend pytest fixtures and test cases for auth, friendships, and throttling
- **Documentation** — `summary.md` structure and this README

AI was used as a pair programmer and architecture advisor. All code was reviewed, understood, and adapted by team members before being committed.

---

## Known Limitations

- **2FA cannot be disabled** once enabled — no endpoint or UI path to turn off TOTP.
- **`/api/token/` bypasses 2FA** — kept for compatibility, but the frontend uses `/api/users/login/` instead.
- **`SECRET_KEY` is hardcoded** in `settings.py` — must be rotated before any production deployment.
