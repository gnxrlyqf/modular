"""
Idempotently provisions a hard-coded Metabase dashboard for the trandandan platform.

Runs as a one-shot init container alongside Metabase. On every start it:
  1. Waits for Metabase to be reachable.
  2. If Metabase has never been set up, performs first-time admin setup.
  3. Adds the trandandan Postgres data source if missing.
  4. Creates a "trandandan" collection if missing.
  5. Creates / updates 12 native-SQL cards, all parameterised by {{user_id}}
     (locked, server-pinned in the JWT) and most also by an optional
     {{date_range}} filter (enabled, `date/range` picker — value is
     `YYYY-MM-DD~YYYY-MM-DD`, split via SPLIT_PART in SQL).
  6. Creates a dashboard wiring those cards to two parameters (`user_id`,
     `date_range`), enables signed-JWT embedding.
  7. Writes the resulting dashboard id + embedding secret to /shared/metabase.json
     so the Django backend can sign per-user embed tokens.

The script is fully idempotent — running it against an already-provisioned
Metabase keeps existing card/dashboard ids stable but will rewrite SQL,
visualization settings, layout, and crossfilter wiring so dashboard updates
ship by redeploying the init container.
"""
from __future__ import annotations

import json
import os
import sys
import time
import uuid
from typing import Any

import requests

MB_URL          = os.environ["MB_URL"]
MB_ADMIN_EMAIL  = os.environ["MB_ADMIN_EMAIL"]
MB_ADMIN_PASS   = os.environ["MB_ADMIN_PASS"]
MB_ADMIN_FIRST  = os.environ.get("MB_ADMIN_FIRST", "Admin")
MB_ADMIN_LAST   = os.environ.get("MB_ADMIN_LAST", "User")
MB_SITE_NAME    = os.environ.get("MB_SITE_NAME", "trandandan")
MB_SECRET       = os.environ["MB_EMBEDDING_SECRET_KEY"]
PG_HOST         = os.environ["POSTGRES_HOST"]
PG_PORT         = int(os.environ.get("POSTGRES_PORT", "5432"))
PG_DB           = os.environ["POSTGRES_DB"]
PG_USER         = os.environ["POSTGRES_USER"]
PG_PASS         = os.environ["POSTGRES_PASSWORD"]
SHARED_PATH     = os.environ.get("SHARED_CONFIG_PATH", "/shared/metabase.json")

COLLECTION_NAME = "trandandan"
DATABASE_NAME   = "trandandan"
DASHBOARD_NAME  = "User Dashboard"

session = requests.Session()


# ─── Palette (matches frontend index.css indigo / cyan / violet stops) ──────
COLOR_INDIGO   = "#818cf8"   # indigo-400
COLOR_VIOLET   = "#a78bfa"   # violet-400
COLOR_CYAN     = "#22d3ee"   # cyan-400
COLOR_BLUE     = "#60a5fa"   # blue-400
COLOR_FUCHSIA  = "#e879f9"
SERIES_COLORS  = [COLOR_INDIGO, COLOR_VIOLET, COLOR_CYAN, COLOR_BLUE, COLOR_FUCHSIA]


# ─── Card definitions ──────────────────────────────────────────────────────
# `accepts_range` controls whether the card's SQL/parameters wire up the
# optional {{date_range}} filter. Cards without it stay global so the
# dashboard still shows anchor numbers when a range is selected.
CARDS: list[dict[str, Any]] = [
    # ── Row 0 — top KPI scalars ────────────────────────────────────────────
    {
        "name": "Total Projects",
        "sql": (
            "SELECT COUNT(*) AS projects "
            "FROM projects_project "
            "WHERE user_id = {{user_id}} "
            "[[ AND DATE(created_at) BETWEEN SPLIT_PART({{date_range}}, '~', 1)::date "
            "                             AND SPLIT_PART({{date_range}}, '~', 2)::date ]]"
        ),
        "display": "scalar",
        "pos": (0, 0, 6, 3),
        "accepts_range": True,
        "viz": {
            "scalar.field": "projects",
            "column_settings": {'["name","projects"]': {"number_style": "decimal"}},
        },
    },
    {
        "name": "Total Time Spent (seconds)",
        "sql": (
            "SELECT COALESCE(SUM((analytics->'session'->>'session_duration')::int), 0) AS total_seconds "
            "FROM projects_project "
            "WHERE user_id = {{user_id}} "
            "[[ AND DATE(updated_at) BETWEEN SPLIT_PART({{date_range}}, '~', 1)::date "
            "                             AND SPLIT_PART({{date_range}}, '~', 2)::date ]]"
        ),
        "display": "scalar",
        "pos": (6, 0, 6, 3),
        "accepts_range": True,
        "viz": {"scalar.field": "total_seconds"},
    },
    {
        "name": "Avg Session Duration (seconds)",
        "sql": (
            "SELECT COALESCE(AVG((analytics->'session'->>'session_duration')::int), 0)::int AS avg_seconds "
            "FROM projects_project "
            "WHERE user_id = {{user_id}} "
            "[[ AND DATE(updated_at) BETWEEN SPLIT_PART({{date_range}}, '~', 1)::date "
            "                             AND SPLIT_PART({{date_range}}, '~', 2)::date ]]"
        ),
        "display": "scalar",
        "pos": (12, 0, 6, 3),
        "accepts_range": True,
        "viz": {"scalar.field": "avg_seconds"},
    },
    {
        "name": "Streak (consecutive active days)",
        "sql": (
            "WITH days AS ( "
            "  SELECT DISTINCT DATE(updated_at) AS d FROM projects_project WHERE user_id = {{user_id}} "
            "), grouped AS ( "
            "  SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM days "
            "), runs AS ( "
            "  SELECT MIN(d) AS first, MAX(d) AS last, COUNT(*) AS len FROM grouped GROUP BY grp "
            ") "
            "SELECT COALESCE(MAX(len) FILTER (WHERE last = CURRENT_DATE OR last = CURRENT_DATE - 1), 0)::int AS streak "
            "FROM runs"
        ),
        "display": "scalar",
        "pos": (18, 0, 3, 3),
        "accepts_range": False,
        "viz": {"scalar.field": "streak"},
    },
    {
        # Sparkline companion to Streak — chromeless line, last 30 days session counts.
        "name": "Streak Trend (30d)",
        "sql": (
            "SELECT d.day::date AS day, COUNT(p.id) AS sessions "
            "FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') AS d(day) "
            "LEFT JOIN projects_project p "
            "       ON p.user_id = {{user_id}} AND DATE(p.updated_at) = d.day::date "
            "GROUP BY d.day ORDER BY d.day"
        ),
        "display": "line",
        "pos": (21, 0, 3, 3),
        "accepts_range": False,
        "viz": {
            "graph.dimensions": ["day"],
            "graph.metrics": ["sessions"],
            "graph.colors": [COLOR_VIOLET],
            "graph.show_values": False,
            "graph.x_axis.axis_enabled": False,
            "graph.y_axis.axis_enabled": False,
            "graph.x_axis.title_text": "",
            "graph.y_axis.title_text": "",
            "graph.x_axis.labels_enabled": False,
            "graph.y_axis.labels_enabled": False,
            "graph.show_goal": False,
            "graph.tooltip_type": "default",
        },
    },

    # ── Row 3 — Active days bar (GitHub-contrib feel, drives crossfilter)
    {
        "name": "Active Days (last 90)",
        "sql": (
            "SELECT d.day::date AS day, "
            "       COALESCE(SUM((p.analytics->'session'->>'session_duration')::int), 0) AS seconds "
            "FROM generate_series(CURRENT_DATE - INTERVAL '89 days', CURRENT_DATE, '1 day') AS d(day) "
            "LEFT JOIN projects_project p "
            "       ON p.user_id = {{user_id}} AND DATE(p.updated_at) = d.day::date "
            "GROUP BY d.day ORDER BY d.day"
        ),
        "display": "bar",
        "pos": (0, 3, 24, 5),
        "accepts_range": False,
        "viz": {
            "graph.dimensions": ["day"],
            "graph.metrics": ["seconds"],
            "graph.x_axis.title_text": "",
            "graph.y_axis.title_text": "seconds active",
            "graph.colors": [COLOR_INDIGO],
            "graph.show_values": False,
            "stackable.stack_type": None,
        },
    },

    # ── Row 7 — Hour-of-day & Module Usage ────────────────────────────────
    {
        "name": "Hour-of-Day Activity",
        "sql": (
            "SELECT EXTRACT(HOUR FROM (p.analytics->'session'->>'opened_at')::timestamp)::int AS hour, "
            "       COUNT(*) AS sessions "
            "FROM projects_project p "
            "WHERE p.user_id = {{user_id}} "
            "  AND p.analytics->'session'->>'opened_at' IS NOT NULL "
            "[[ AND DATE((p.analytics->'session'->>'opened_at')::timestamp) "
            "       BETWEEN SPLIT_PART({{date_range}}, '~', 1)::date "
            "           AND SPLIT_PART({{date_range}}, '~', 2)::date ]] "
            "GROUP BY 1 ORDER BY 1"
        ),
        "display": "bar",
        "pos": (0, 7, 12, 5),
        "accepts_range": True,
        "viz": {
            "graph.dimensions": ["hour"],
            "graph.metrics": ["sessions"],
            "graph.x_axis.title_text": "hour of day",
            "graph.y_axis.title_text": "sessions",
            "graph.colors": [COLOR_VIOLET],
        },
    },
    {
        "name": "Module Usage Breakdown",
        "sql": (
            "SELECT key AS module_type, SUM((value)::int) AS count "
            "FROM projects_project p, LATERAL jsonb_each(COALESCE(p.analytics->'modules','{}'::jsonb)) "
            "WHERE p.user_id = {{user_id}} "
            "GROUP BY 1 HAVING SUM((value)::int) > 0 ORDER BY 2 DESC"
        ),
        "display": "row",
        "pos": (12, 7, 12, 5),
        "accepts_range": False,
        "viz": {
            "graph.dimensions": ["module_type"],
            "graph.metrics": ["count"],
            "graph.colors": [COLOR_CYAN],
        },
    },

    # ── Row 12 — Projects over time & Vote velocity ───────────────────────
    {
        "name": "Projects Created Over Time",
        "sql": (
            "SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*) AS projects "
            "FROM projects_project WHERE user_id = {{user_id}} "
            "GROUP BY 1 ORDER BY 1"
        ),
        "display": "line",
        "pos": (0, 12, 12, 5),
        "accepts_range": False,
        "viz": {
            "graph.dimensions": ["day"],
            "graph.metrics": ["projects"],
            "graph.colors": [COLOR_BLUE],
            "graph.show_trendline": True,
        },
    },
    {
        "name": "Upvote Velocity (cumulative)",
        "sql": (
            "WITH daily AS ( "
            "  SELECT DATE(p.created_at) AS day, COUNT(*) FILTER (WHERE v.vote = 1) AS upvotes "
            "  FROM projects_project p LEFT JOIN projects_projectvote v ON v.project_id = p.id "
            "  WHERE p.user_id = {{user_id}} "
            "  GROUP BY 1 "
            ") "
            "SELECT day, SUM(upvotes) OVER (ORDER BY day) AS cumulative_upvotes "
            "FROM daily ORDER BY day"
        ),
        "display": "line",
        "pos": (12, 12, 12, 5),
        "accepts_range": False,
        "viz": {
            "graph.dimensions": ["day"],
            "graph.metrics": ["cumulative_upvotes"],
            "graph.colors": [COLOR_FUCHSIA],
        },
    },

    # ── Row 17 — Top patches table & remaining KPIs ───────────────────────
    {
        "name": "Top Patches",
        "sql": (
            "SELECT p.name AS project, "
            "       COALESCE(SUM(CASE WHEN v.vote=1 THEN 1 WHEN v.vote=-1 THEN -1 ELSE 0 END), 0) AS net_votes, "
            "       COUNT(v.*) FILTER (WHERE v.vote = 1) AS upvotes, "
            "       p.created_at::date AS created "
            "FROM projects_project p LEFT JOIN projects_projectvote v ON v.project_id = p.id "
            "WHERE p.user_id = {{user_id}} "
            "[[ AND DATE(p.created_at) BETWEEN SPLIT_PART({{date_range}}, '~', 1)::date "
            "                               AND SPLIT_PART({{date_range}}, '~', 2)::date ]] "
            "GROUP BY p.id, p.name, p.created_at "
            "ORDER BY net_votes DESC, upvotes DESC "
            "LIMIT 10"
        ),
        "display": "table",
        "pos": (0, 17, 12, 7),
        "accepts_range": True,
        "viz": {
            "table.columns": [
                {"name": "project",   "enabled": True},
                {"name": "net_votes", "enabled": True},
                {"name": "upvotes",   "enabled": True},
                {"name": "created",   "enabled": True},
            ],
        },
    },
    {
        "name": "Total Shares",
        "sql": (
            "SELECT COALESCE(SUM((analytics->'sharing'->>'share_count')::int), 0) AS shares "
            "FROM projects_project WHERE user_id = {{user_id}}"
        ),
        "display": "scalar",
        "pos": (12, 17, 6, 3),
        "accepts_range": False,
        "viz": {"scalar.field": "shares"},
    },
    {
        "name": "Net Votes Received",
        "sql": (
            "SELECT COALESCE(SUM(CASE WHEN v.vote=1 THEN 1 WHEN v.vote=-1 THEN -1 ELSE 0 END), 0) AS net_votes "
            "FROM projects_project p LEFT JOIN projects_projectvote v ON v.project_id = p.id "
            "WHERE p.user_id = {{user_id}}"
        ),
        "display": "scalar",
        "pos": (18, 17, 6, 3),
        "accepts_range": False,
        "viz": {"scalar.field": "net_votes"},
    },
]



# ─── Helpers ────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    print(f"[metabase-init] {msg}", flush=True)


def wait_for_metabase() -> None:
    for _ in range(120):
        try:
            r = session.get(f"{MB_URL}/api/health", timeout=3)
            if r.ok:
                log("metabase is up")
                return
        except requests.RequestException:
            pass
        time.sleep(2)
    sys.exit("metabase never came up")


def first_time_setup() -> bool:
    props = session.get(f"{MB_URL}/api/session/properties").json()
    setup_token = props.get("setup-token")
    if not setup_token:
        return False
    log("performing first-time setup")
    r = session.post(
        f"{MB_URL}/api/setup",
        json={
            "token": setup_token,
            "user": {
                "email": MB_ADMIN_EMAIL, "password": MB_ADMIN_PASS,
                "first_name": MB_ADMIN_FIRST, "last_name": MB_ADMIN_LAST,
                "site_name": MB_SITE_NAME,
            },
            "prefs": {"site_name": MB_SITE_NAME, "allow_tracking": False},
            "database": None,
        },
    )
    if r.status_code == 403:
        log("setup already done (token stale) — skipping")
        return False
    r.raise_for_status()
    return True


def login() -> str:
    r = session.post(
        f"{MB_URL}/api/session",
        json={"username": MB_ADMIN_EMAIL, "password": MB_ADMIN_PASS},
    )
    r.raise_for_status()
    token = r.json()["id"]
    session.headers["X-Metabase-Session"] = token
    return token


def enable_embedding_globally() -> None:
    session.put(
        f"{MB_URL}/api/setting/enable-embedding",
        json={"value": True},
    ).raise_for_status()


def ensure_database() -> int:
    dbs = session.get(f"{MB_URL}/api/database").json()
    items = dbs["data"] if isinstance(dbs, dict) else dbs
    for db in items:
        if db.get("name") == DATABASE_NAME and db.get("engine") == "postgres":
            return db["id"]
    log("adding postgres database")
    r = session.post(
        f"{MB_URL}/api/database",
        json={
            "name": DATABASE_NAME,
            "engine": "postgres",
            "details": {
                "host": PG_HOST, "port": PG_PORT, "dbname": PG_DB,
                "user": PG_USER, "password": PG_PASS,
                "ssl": False, "tunnel-enabled": False,
            },
            "is_full_sync": True,
            "is_on_demand": False,
        },
    )
    r.raise_for_status()
    return r.json()["id"]


def ensure_collection() -> int:
    cols = session.get(f"{MB_URL}/api/collection").json()
    for c in cols:
        if c.get("name") == COLLECTION_NAME:
            return c["id"]
    log("creating collection")
    r = session.post(
        f"{MB_URL}/api/collection",
        json={"name": COLLECTION_NAME, "color": "#509EE3"},
    )
    r.raise_for_status()
    return r.json()["id"]


def find_card(name: str, collection_id: int) -> dict | None:
    """Look up a card by name within our collection via the collection-items endpoint.
    This is more reliable than GET /api/card?f=all which can omit recently-failed inserts."""
    items = session.get(
        f"{MB_URL}/api/collection/{collection_id}/items",
        params={"models": "card"},
    ).json()
    rows = items.get("data", items) if isinstance(items, dict) else items
    for it in rows:
        if it.get("name") == name:
            # Fetch full card so we have dataset_query / display fields for comparison.
            r = session.get(f"{MB_URL}/api/card/{it['id']}")
            if r.ok:
                return r.json()
    return None


def _build_card_body(spec: dict[str, Any], db_id: int) -> dict[str, Any]:
    """Builds the POST/PUT body for a card. Tag/parameter ids are stable per build."""
    user_tag_id  = str(uuid.uuid5(uuid.NAMESPACE_OID, f"{spec['name']}|user_id"))
    user_param_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"{spec['name']}|param|user_id"))

    template_tags: dict[str, Any] = {
        "user_id": {
            "id": user_tag_id, "name": "user_id",
            "display-name": "User ID",
            "type": "number", "required": True,
        },
    }
    parameters = [{
        "id": user_param_id, "type": "number/=",
        "target": ["variable", ["template-tag", "user_id"]],
        "name": "User ID", "slug": "user_id",
    }]

    if spec.get("accepts_range"):
        range_tag_id   = str(uuid.uuid5(uuid.NAMESPACE_OID, f"{spec['name']}|date_range"))
        range_param_id = str(uuid.uuid5(uuid.NAMESPACE_OID, f"{spec['name']}|param|date_range"))
        template_tags["date_range"] = {
            "id": range_tag_id, "name": "date_range",
            "display-name": "Date Range",
            "type": "text", "required": False,
        }
        parameters.append({
            "id": range_param_id, "type": "date/range",
            "target": ["variable", ["template-tag", "date_range"]],
            "name": "Date Range", "slug": "date_range",
        })

    return {
        "name": spec["name"],
        "display": spec["display"],
        "visualization_settings": spec.get("viz", {}),
        "dataset_query": {
            "type": "native",
            "database": db_id,
            "native": {"query": spec["sql"], "template-tags": template_tags},
        },
        "parameters": parameters,
    }


def ensure_card(spec: dict[str, Any], db_id: int, collection_id: int) -> dict:
    """Create the card if missing; otherwise rewrite SQL/viz/params so dashboard updates ship on redeploy."""
    body = _build_card_body(spec, db_id)
    existing = find_card(spec["name"], collection_id)
    if existing:
        # Compare critical fields; if unchanged, skip the PUT.
        same_sql  = existing.get("dataset_query", {}).get("native", {}).get("query") == spec["sql"]
        same_disp = existing.get("display") == spec["display"]
        if same_sql and same_disp:
            return existing
        log(f"updating card: {spec['name']}")
        r = session.put(f"{MB_URL}/api/card/{existing['id']}", json=body)
        r.raise_for_status()
        return r.json()

    log(f"creating card: {spec['name']}")
    body["collection_id"] = collection_id
    r = session.post(f"{MB_URL}/api/card", json=body)
    if not r.ok:
        log(f"card create failed ({r.status_code}): {r.text[:400]}")
        # Metabase H2 sequence issues can cause a 500 even when the row was
        # actually inserted. Re-check the collection before giving up.
        retry = find_card(spec["name"], collection_id)
        if retry:
            log(f"card found after 500 — using existing id={retry['id']}")
            return retry
        r.raise_for_status()
    return r.json()


def find_dashboard(name: str, collection_id: int) -> dict | None:
    items = session.get(
        f"{MB_URL}/api/collection/{collection_id}/items",
        params={"models": "dashboard"},
    ).json()
    rows = items["data"] if isinstance(items, dict) else items
    for it in rows:
        if it.get("name") == name and it.get("model") == "dashboard":
            return it
    return None


def ensure_dashboard(cards: list[dict], collection_id: int) -> int:
    """Creates / updates the dashboard parameters, dashcards, and embedding settings."""
    existing = find_dashboard(DASHBOARD_NAME, collection_id)

    # Stable param ids across runs so dashcard mappings don't churn.
    user_param_id       = str(uuid.uuid5(uuid.NAMESPACE_OID, "dashboard|user_id"))
    date_range_param_id = str(uuid.uuid5(uuid.NAMESPACE_OID, "dashboard|date_range"))

    if existing:
        dash_id = existing["id"]
        log(f"updating existing dashboard id={dash_id}")
        # Fetch the current dashcards so we can wipe them cleanly.
        # Metabase: PUT with negative ids ADDS to existing cards; we must
        # explicitly clear first so a re-run doesn't accumulate duplicates.
        full = session.get(f"{MB_URL}/api/dashboard/{dash_id}").json()
        old_dashcards = full.get("dashcards", [])
        if old_dashcards:
            log(f"clearing {len(old_dashcards)} existing dashcards")
            session.put(
                f"{MB_URL}/api/dashboard/{dash_id}",
                json={"dashcards": []},
            ).raise_for_status()
    else:
        log("creating dashboard")
        r = session.post(
            f"{MB_URL}/api/dashboard",
            json={
                "name": DASHBOARD_NAME,
                "collection_id": collection_id,
                "description": "Per-user analytics for trandandan projects.",
            },
        )
        r.raise_for_status()
        dash_id = r.json()["id"]

    # Build dashcards. All use negative ids so Metabase treats them as new inserts
    # (safe after the clear above).
    dashcards = []
    for idx, (spec, card) in enumerate(zip(CARDS, cards)):
        col, row, size_x, size_y = spec["pos"]
        param_mappings = [{
            "parameter_id": user_param_id,
            "card_id": card["id"],
            "target": ["variable", ["template-tag", "user_id"]],
        }]
        if spec.get("accepts_range"):
            param_mappings.append({
                "parameter_id": date_range_param_id,
                "card_id": card["id"],
                "target": ["variable", ["template-tag", "date_range"]],
            })

        viz_settings: dict[str, Any] = {}

        dashcards.append({
            "id": -(idx + 1),
            "card_id": card["id"],
            "row": row, "col": col,
            "size_x": size_x, "size_y": size_y,
            "parameter_mappings": param_mappings,
            "visualization_settings": viz_settings,
        })

    session.put(
        f"{MB_URL}/api/dashboard/{dash_id}",
        json={
            "parameters": [
                {
                    "id": user_param_id,
                    "name": "User ID",
                    "slug": "user_id",
                    "type": "number/=",
                    "sectionId": "number",
                },
                {
                    "id": date_range_param_id,
                    "name": "Date Range",
                    "slug": "date_range",
                    "type": "date/range",
                    "sectionId": "date",
                },
            ],
            "dashcards": dashcards,
        },
    ).raise_for_status()

    # Enable signed-JWT embedding. user_id locked (server-pinned),
    # day enabled (URL-overridable so the Active-Days crossfilter works).
    session.put(
        f"{MB_URL}/api/dashboard/{dash_id}",
        json={
            "enable_embedding": True,
            "embedding_params": {"user_id": "locked", "date_range": "enabled"},
        },
    ).raise_for_status()

    return dash_id


def write_shared_config(dashboard_id: int) -> None:
    os.makedirs(os.path.dirname(SHARED_PATH), exist_ok=True)
    with open(SHARED_PATH, "w") as f:
        json.dump({
            "dashboard_id": dashboard_id,
            "embedding_secret": MB_SECRET,
        }, f)
    log(f"wrote shared config to {SHARED_PATH}")


def main() -> None:
    wait_for_metabase()
    first_time_setup()
    login()
    enable_embedding_globally()
    db_id  = ensure_database()
    col_id = ensure_collection()
    cards  = [ensure_card(spec, db_id, col_id) for spec in CARDS]
    dash_id = ensure_dashboard(cards, col_id)
    write_shared_config(dash_id)
    log(f"done. dashboard_id={dash_id}")


if __name__ == "__main__":
    main()
