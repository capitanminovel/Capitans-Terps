import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "capitan.db"
BASE    = Path(__file__).parent


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS strains (
                id      TEXT PRIMARY KEY,
                name    TEXT NOT NULL,
                breeder TEXT NOT NULL,
                status  TEXT NOT NULL DEFAULT 'Vault',
                notes   TEXT         DEFAULT '',
                added   TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS research (
                strain_id         TEXT PRIMARY KEY,
                genetics_lineage  TEXT,
                terpene_profile   TEXT,
                effects           TEXT,
                flavor_aroma      TEXT,
                grow_notes        TEXT,
                rosin_extraction  TEXT,
                generated_at      TEXT,
                FOREIGN KEY (strain_id) REFERENCES strains(id) ON DELETE CASCADE
            );
        """)
    _migrate_from_json()


def _migrate_from_json():
    strains_file  = BASE / "data" / "strains.json"
    research_file = BASE / "data" / "research_cache.json"

    if not strains_file.exists():
        return

    with open(strains_file) as f:
        strains_data = json.load(f)

    research_data = {}
    if research_file.exists():
        with open(research_file) as f:
            research_data = json.load(f)

    with get_db() as conn:
        for s in strains_data.get("strains", []):
            conn.execute(
                "INSERT OR IGNORE INTO strains (id, name, breeder, status, notes, added) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (s["id"], s["name"], s["breeder"],
                 s.get("status", "Vault"), s.get("notes", ""), s["added"]),
            )

        for strain_id, r in research_data.items():
            conn.execute(
                "INSERT OR IGNORE INTO research "
                "(strain_id, genetics_lineage, terpene_profile, effects, "
                " flavor_aroma, grow_notes, rosin_extraction, generated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (strain_id, r.get("genetics_lineage"), r.get("terpene_profile"),
                 r.get("effects"), r.get("flavor_aroma"), r.get("grow_notes"),
                 r.get("rosin_extraction"), r.get("generated_at")),
            )
