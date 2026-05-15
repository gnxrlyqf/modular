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
| iboutadg | _TBD_ | _TBD_ |
| mchetoui | _TBD_ | _TBD_ |
| aelsayed | _TBD_ | _TBD_ |
| wtoumi | _TBD_ | _TBD_ |

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
| Registration + email verification | Register with username/email/password; activation link sent via email | _TBD_ |
| Login + 2FA (TOTP) | JWT login with optional TOTP second factor; QR setup flow | _TBD_ |
| OAuth login | Google, Facebook, 42 via popup-based OAuth2 flow | _TBD_ |
| Password reset | Email-based reset link → SPA confirm page | _TBD_ |
| Profile management | Display name, bio, avatar upload (jpg/png/webp, 5MB cap) | _TBD_ |
| Friends system | Send/accept/decline/cancel friend requests; +100 XP on accept | _TBD_ |
| Blocking | Block/unblock users; blocks suppress profiles, messages, and public visibility | _TBD_ |
| Messaging | Real-time polling chat between friends; thread list with unread counts | _TBD_ |
| Notifications | In-app notifications for friend requests and messages; mark-read | _TBD_ |
| Modular synth editor | Create/edit synth patches in browser; autosave via PATCH | _TBD_ |
| Projects — community feed | Browse all users' projects sorted by net votes | _TBD_ |
| Projects — voting | Upvote/downvote projects (+1/-1/0 change) | _TBD_ |
| Projects — sharing | Share project URL; increments share count + tracks share days | _TBD_ |
| User search | Search users by username/email; add friend / message / block per row | _TBD_ |
| Public profiles | View another user's profile, projects, and friendship status | _TBD_ |
| Admin panel | List users, delete accounts, view per-user and global logs | _TBD_ |
| Analytics dashboard | Per-user Metabase dashboard (session time, module usage, streaks, etc.) | _TBD_ |
| i18n | EN / FR / AR / DE / ES; plural + React node interpolation helpers | _TBD_ |
| XP / leveling | Actions award XP (bio update +50, friendship accept +100, profile patch +25) | _TBD_ |
| ELK observability | App logs + container metrics shipped to Elasticsearch; visualized in Kibana | _TBD_ |

---

## Modules

> _Module list to be confirmed by team. Fill in below with Major (2 pts) or Minor (1 pt) per chosen module._

| Module | Type | Points | Description | Implemented by |
|---|---|---|---|---|
| _TBD_ | Major | 2 | _TBD_ | _TBD_ |
| _TBD_ | Minor | 1 | _TBD_ | _TBD_ |

**Total points: _TBD_**

---

## Individual Contributions

### iboutadg
- _TBD_

### mchetoui
- _TBD_

### aelsayed
- _TBD_

### wtoumi
- _TBD_

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
- **Email backend defaults to console** — verification and reset emails print to stdout; configure SMTP for real delivery.
- **`/api/token/` bypasses 2FA** — kept for compatibility, but the frontend uses `/api/users/login/` instead.
- **Prometheus + Grafana are disabled** — services are configured but commented out in `docker-compose.yml`; ELK covers observability.
- **Synthesizer audio engine is a placeholder** — the modular synth UI exists but audio/DSP is not implemented.
- **`DEBUG=True` and `CORS_ALLOW_ALL_ORIGINS=True`** — not safe for production; for development only.
- **`SECRET_KEY` is hardcoded** in `settings.py` — must be rotated before any production deployment.
