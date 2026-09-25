import os
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip("\"'"))

def resolve_data_file() -> Path:
    env_data = os.getenv("DATA_FILE")
    if env_data:
        try:
            p = Path(env_data)
            if p.exists():
                return p
            p_rel = BASE_DIR / env_data
            if p_rel.exists():
                return p_rel
        except Exception:
            pass
    
    candidates = [
        BASE_DIR / "data" / "two.txt",
        BASE_DIR / "two.txt",
        BASE_DIR.parent / "two.txt",
    ]
    env_media = os.getenv("MEDIA_DIR")
    if env_media:
        candidates.append(Path(env_media) / "two.txt")
    # Check common media/USB mount points dynamically
    try:
        media_root = Path("/media")
        if media_root.exists():
            for user_d in media_root.iterdir():
                if user_d.is_dir():
                    candidates.append(user_d / "USB_SHARED" / "two.txt")
    except Exception:
        pass
    for c in candidates:
        try:
            if c.exists():
                return c
        except Exception:
            pass
    return BASE_DIR / "data" / "two.txt"

def resolve_db_file() -> Path:
    default_db = BASE_DIR / "database" / "data.db"
    env_db = os.getenv("DATABASE_FILE")
    if env_db:
        try:
            p = Path(env_db)
            if not p.is_absolute():
                p = BASE_DIR / env_db
            if p.exists():
                return p
            # If default_db exists and env path doesn't, prefer default_db
            if default_db.exists():
                return default_db
            p.parent.mkdir(parents=True, exist_ok=True)
            return p
        except Exception:
            if default_db.exists():
                return default_db
    
    try:
        default_db.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    return default_db

DATA_FILE_PATH = resolve_data_file()
DATABASE_FILE_PATH = resolve_db_file()

def get_db_connection(timeout: float = 30.0) -> sqlite3.Connection:
    conn = sqlite3.connect(str(DATABASE_FILE_PATH), timeout=timeout)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -100000;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    return conn

def init_db(conn: sqlite3.Connection = None):
    close_after = False
    if conn is None:
        conn = get_db_connection()
        close_after = True
    
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY,
        integer_key INTEGER,
        hash_key TEXT,
        name TEXT,
        fname TEXT,
        gname TEXT,
        dob_year INTEGER,
        gender INTEGER,
        province TEXT,
        district TEXT,
        province_code TEXT,
        district_code TEXT,
        record_number INTEGER,
        page_number INTEGER,
        book_name TEXT,
        cropped_path TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analytics_cache (
        cache_key TEXT PRIMARY KEY,
        cache_data TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ingestion_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file TEXT,
        total_source_rows INTEGER,
        imported_rows INTEGER,
        failed_rows INTEGER,
        skipped_rows INTEGER,
        duplicate_rows INTEGER,
        duration_seconds REAL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        query_params TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_prov_dist ON records (province, district);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_district ON records (district);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_dob ON records (dob_year);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_gender ON records (gender);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_hash ON records (hash_key);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_name ON records (name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_fname ON records (fname);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_book ON records (book_name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_prov_code ON records (province_code);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_dist_code ON records (district_code);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_gname ON records (gname);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_record_num ON records (record_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_page_num ON records (page_number);")

    # Reference Extension: Humanitarian RTP Relief Registry (626K survey schema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rtp_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT,
        pid INTEGER,
        serial TEXT,
        number TEXT,
        name TEXT,
        fname TEXT,
        gfname TEXT,
        tazkira TEXT,
        job TEXT,
        family_count INTEGER DEFAULT 5,
        nahya TEXT,
        gozar TEXT,
        bread_count INTEGER DEFAULT 10,
        worker INTEGER DEFAULT 1,
        income TEXT DEFAULT '0',
        status TEXT DEFAULT 'Active',
        phone TEXT,
        phone_copy TEXT,
        shop TEXT,
        province_id TEXT DEFAULT 'کابل',
        datasource_id TEXT,
        description TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rtp_name ON rtp_records (name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rtp_phone ON rtp_records (phone);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rtp_job ON rtp_records (job);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rtp_prov ON rtp_records (province_id);")

    # Reference Extension: IVP Identity Verification Security & Credentials (1,112 accounts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ivp_auth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        normalized_username TEXT,
        email TEXT,
        normalized_email TEXT,
        email_confirmed INTEGER DEFAULT 1,
        password_hash TEXT,
        security_stamp TEXT,
        concurrency_stamp TEXT,
        phone_number TEXT,
        phone_number_confirmed INTEGER DEFAULT 1,
        two_factor_enabled INTEGER DEFAULT 0,
        lockout_end TEXT,
        lockout_enabled INTEGER DEFAULT 1,
        access_failed_count INTEGER DEFAULT 0,
        first_name TEXT,
        last_name TEXT,
        office_id INTEGER DEFAULT 1,
        disabled INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        request_source_id TEXT,
        created_on TEXT,
        created_by TEXT,
        modified_on TEXT,
        modified_by TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ivp_username ON ivp_auth (username);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ivp_office ON ivp_auth (office_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ivp_role ON ivp_auth (is_admin, disabled);")

    # Reference Extension: 128D Biometric Face Vectors
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS face_vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER,
        path TEXT,
        vector TEXT,
        landmark TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_face_record ON face_vectors (record_id);")

    conn.commit()
    if close_after:
        conn.close()

if __name__ == "__main__":
    print(f"Data File Path: {DATA_FILE_PATH} (exists: {DATA_FILE_PATH.exists()})")
    print(f"Database File Path: {DATABASE_FILE_PATH}")
    init_db()
    print("Database initialized successfully.")
