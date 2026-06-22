import psycopg
from psycopg import ClientCursor
from psycopg.rows import dict_row
import os
import json
from contextlib import contextmanager

DATABASE_URL = os.environ.get("DATABASE_URL", "")

CATEGORIES = [
    "alter", "vermoegen", "einkommensschutz", "gesundheit",
    "wohnwuensche", "todesfall", "haftpflicht", "hausrat",
    "gebaeude", "rechtsschutz", "unfall", "tier",
    "kfz", "kindervorsorge", "immobilien",
]


class _Conn:
    """Wraps psycopg3 connection to mimic sqlite3 connection interface."""
    def __init__(self, raw):
        self._raw = raw

    def execute(self, sql, params=None):
        cur = ClientCursor(self._raw, row_factory=dict_row)
        cur.execute(sql, params)
        return cur

    def commit(self):
        self._raw.commit()

    def rollback(self):
        self._raw.rollback()

    def close(self):
        self._raw.close()


@contextmanager
def db():
    raw = psycopg.connect(DATABASE_URL)
    conn = _Conn(raw)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


_TABLES = [
    """
    CREATE TABLE IF NOT EXISTS customers (
        id          SERIAL PRIMARY KEY,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW(),

        p1_anrede       TEXT,
        p1_vorname      TEXT NOT NULL DEFAULT '',
        p1_nachname     TEXT NOT NULL DEFAULT '',
        p1_strasse      TEXT,
        p1_plz          TEXT,
        p1_ort          TEXT,
        p1_geburtsdatum TEXT,
        p1_familienstand TEXT,
        p1_hobby        TEXT,
        p1_haustiere    TEXT,
        p1_beruf        TEXT,
        p1_abschluss    TEXT,
        p1_gehalt_netto DOUBLE PRECISION,
        p1_gehalt_brutto DOUBLE PRECISION,
        p1_arbeitgeber  TEXT,
        p1_arbeitsverhaeltnis TEXT,
        p1_gkv_anbieter TEXT,
        p1_gkv_stand    TEXT,
        p1_raucher      INTEGER DEFAULT 0,
        p1_email        TEXT,
        p1_handy        TEXT,
        p1_festnetz     TEXT,
        p1_iban         TEXT,

        p2_anrede       TEXT,
        p2_vorname      TEXT,
        p2_nachname     TEXT,
        p2_strasse      TEXT,
        p2_plz          TEXT,
        p2_ort          TEXT,
        p2_geburtsdatum TEXT,
        p2_familienstand TEXT,
        p2_hobby        TEXT,
        p2_haustiere    TEXT,
        p2_beruf        TEXT,
        p2_abschluss    TEXT,
        p2_gehalt_netto DOUBLE PRECISION,
        p2_gehalt_brutto DOUBLE PRECISION,
        p2_arbeitgeber  TEXT,
        p2_arbeitsverhaeltnis TEXT,
        p2_gkv_anbieter TEXT,
        p2_gkv_stand    TEXT,
        p2_raucher      INTEGER DEFAULT 0,
        p2_email        TEXT,
        p2_handy        TEXT,
        p2_festnetz     TEXT,
        p2_iban         TEXT,

        kinder          TEXT DEFAULT '[]',
        ap_scores       TEXT DEFAULT '{}',

        qualitaet_absicherung TEXT,
        selbstbeteiligung     TEXT,

        budget_absicherung_monatlich  DOUBLE PRECISION,
        budget_absicherung_einmalig   DOUBLE PRECISION,
        budget_ansparung_monatlich    DOUBLE PRECISION,
        budget_ansparung_einmalig     DOUBLE PRECISION,
        budget_notizen                TEXT,

        hhr_einnahmen_gehalt          DOUBLE PRECISION,
        hhr_einnahmen_zuschuesse      DOUBLE PRECISION,
        hhr_einnahmen_weitere         DOUBLE PRECISION,
        hhr_ausgaben_gesamt           DOUBLE PRECISION,
        hhr_freier_betrag             DOUBLE PRECISION,
        hhr_notizen                   TEXT,

        schaeden_notizen   TEXT,
        empfehlung_notizen TEXT,

        bewertung_google    INTEGER,
        bewertung_trustpilot INTEGER,
        bewertung_facebook  INTEGER,

        folgetermin_datum   TEXT,
        folgetermin_notizen TEXT,

        berater        TEXT,
        eingruppierung TEXT,
        notizen        TEXT,

        kontaktquelle           TEXT DEFAULT '[]',
        kontaktquelle_sonstiges TEXT DEFAULT '',
        anfrage_kategorien      TEXT DEFAULT '[]'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS customer_categories (
        id          SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        category    TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'nicht_besprochen',
        notizen     TEXT DEFAULT '',
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(customer_id, category)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS appointments (
        id          SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        datum       TEXT NOT NULL,
        status      TEXT DEFAULT '',
        notizen     TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        type        TEXT NOT NULL DEFAULT 'manual',
        title       TEXT NOT NULL,
        description TEXT DEFAULT '',
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        meta        TEXT DEFAULT '{}',
        status      TEXT NOT NULL DEFAULT 'open',
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS contracts (
        id              SERIAL PRIMARY KEY,
        customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        category        TEXT NOT NULL,
        gesellschaft    TEXT DEFAULT '',
        police_nr       TEXT DEFAULT '',
        ablaufdatum     TEXT DEFAULT '',
        beitrag_alt     DOUBLE PRECISION,
        absicherung_alt TEXT DEFAULT '',
        beitrag_neu     DOUBLE PRECISION,
        absicherung_neu TEXT DEFAULT '',
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(customer_id, category)
    )
    """,
]


def init_db():
    with db() as conn:
        for sql in _TABLES:
            conn.execute(sql)
