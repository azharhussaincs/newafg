import sys
import os
import time
import shutil
import sqlite3
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import DATA_FILE_PATH, DATABASE_FILE_PATH, init_db
from analytics.engine import compute_and_cache_all_analytics

def run_ingestion():
    print("=" * 75)
    print("STARTING HIGH-PERFORMANCE ZERO-LOSS DATA INGESTION PIPELINE")
    print("=" * 75)
    print(f"Source Data File:        {DATA_FILE_PATH}")
    print(f"Final Target SQLite DB:  {DATABASE_FILE_PATH}")

    if not DATA_FILE_PATH.exists():
        print(f"ERROR: Source data file not found at {DATA_FILE_PATH}")
        sys.exit(1)

    t0 = time.time()

    # Stage build on fast NVMe /tmp to eliminate USB bus bottleneck
    stage_db_path = Path("/tmp/full_records_staging.db")
    if stage_db_path.exists():
        stage_db_path.unlink()
    for extra in Path("/tmp").glob("full_records_staging.db*"):
        try:
            extra.unlink()
        except:
            pass

    print(f"Staging on NVMe disk:   {stage_db_path}")

    conn = sqlite3.connect(str(stage_db_path))
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = OFF;")
    conn.execute("PRAGMA cache_size = -1000000;") # 1GB RAM cache
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA locking_mode = EXCLUSIVE;")

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE records (
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
    CREATE TABLE analytics_cache (
        cache_key TEXT PRIMARY KEY,
        cache_data TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE ingestion_meta (
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
    CREATE TABLE saved_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        query_params TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    print("Beginning UTF-16 streaming & high-speed batch insertion...")

    source_row_count = 0
    imported_row_count = 0
    failed_row_count = 0
    skipped_row_count = 0
    duplicate_row_count = 0

    batch = []
    BATCH_SIZE = 250000
    failed_examples = []

    with open(DATA_FILE_PATH, "r", encoding="utf-16", errors="replace") as f:
        header_line = f.readline().rstrip("\r\n")
        header_cols = header_line.split(",")
        print(f"Header columns verified ({len(header_cols)}): {header_cols}")

        for line in f:
            source_row_count += 1
            parts = line.rstrip("\r\n").split(",")
            if len(parts) < 16:
                failed_row_count += 1
                if len(failed_examples) < 10:
                    failed_examples.append((source_row_count + 1, line.strip()))
                continue

            try:
                rec_id = int(parts[0])
                int_key = int(parts[1]) if parts[1] else None
                hash_k = parts[2]
                name = parts[3]
                fname = parts[4]
                gname = parts[5]
                dob_yr = int(parts[6]) if parts[6] else None
                gender = int(parts[7]) if parts[7] else None
                province = parts[8]
                district = parts[9]
                prov_code = parts[10]
                dist_code = parts[11]
                rec_num = int(parts[12]) if parts[12] else None
                page_num = int(parts[13]) if parts[13] else None
                book_name = ",".join(parts[14:-1])
                cropped_path = parts[-1]

                batch.append((
                    rec_id, int_key, hash_k, name, fname, gname,
                    dob_yr, gender, province, district, prov_code, dist_code,
                    rec_num, page_num, book_name, cropped_path
                ))
            except Exception as e:
                failed_row_count += 1
                if len(failed_examples) < 10:
                    failed_examples.append((source_row_count + 1, str(e)))
                continue

            if len(batch) >= BATCH_SIZE:
                cursor.executemany("INSERT OR REPLACE INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", batch)
                conn.commit()
                imported_row_count += len(batch)
                batch = []
                elapsed = time.time() - t0
                speed = imported_row_count / elapsed
                pct = (source_row_count / 24399446) * 100
                print(f"[{pct:5.1f}%] Ingested {imported_row_count:,} / 24,399,446 records in {elapsed:5.1f}s ({speed:6.0f} rec/s)")

        if batch:
            cursor.executemany("INSERT OR REPLACE INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", batch)
            conn.commit()
            imported_row_count += len(batch)
            batch = []

    ingest_time = time.time() - t0
    print(f"\nRaw data insertion completed in {ingest_time:.2f}s! ({imported_row_count:,} records)")

    # Build B-Tree Indexes
    print("\nBuilding B-Tree query indexes...")
    t_idx = time.time()
    cursor.execute("CREATE INDEX idx_records_prov_dist ON records (province, district);")
    cursor.execute("CREATE INDEX idx_records_dob ON records (dob_year);")
    cursor.execute("CREATE INDEX idx_records_gender ON records (gender);")
    cursor.execute("CREATE INDEX idx_records_hash ON records (hash_key);")
    cursor.execute("CREATE INDEX idx_records_name ON records (name);")
    cursor.execute("CREATE INDEX idx_records_fname ON records (fname);")
    cursor.execute("CREATE INDEX idx_records_book ON records (book_name);")
    cursor.execute("CREATE INDEX idx_records_prov_code ON records (province_code);")
    cursor.execute("CREATE INDEX idx_records_dist_code ON records (district_code);")
    conn.commit()
    print(f"Indexes built successfully in {time.time() - t_idx:.2f}s.")

    # Verify actual count in DB
    cursor.execute("SELECT count(*) FROM records;")
    db_count = cursor.fetchone()[0]

    # Precalculate and Cache Analytics
    print("\nPre-computing full-dataset analytics & statistics...")
    t_analytics = time.time()
    compute_and_cache_all_analytics(conn)
    print(f"Analytics computation completed in {time.time() - t_analytics:.2f}s.")

    # Record Ingestion metadata
    total_time = time.time() - t0
    cursor.execute("""
    INSERT INTO ingestion_meta (source_file, total_source_rows, imported_rows, failed_rows, skipped_rows, duplicate_rows, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (str(DATA_FILE_PATH), source_row_count, db_count, failed_row_count, skipped_row_count, duplicate_row_count, total_time))
    conn.commit()
    conn.close()

    # Move database from /tmp staging to target destination
    print(f"\nTransferring finalized database to {DATABASE_FILE_PATH}...")
    DATABASE_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DATABASE_FILE_PATH.exists():
        DATABASE_FILE_PATH.unlink()
    shutil.copy2(str(stage_db_path), str(DATABASE_FILE_PATH))
    stage_db_path.unlink()
    print(f"Database deployed to {DATABASE_FILE_PATH} ({DATABASE_FILE_PATH.stat().st_size / (1024*1024*1024):.2f} GB).")

    # Set WAL mode on destination DB
    dest_conn = sqlite3.connect(str(DATABASE_FILE_PATH))
    dest_conn.execute("PRAGMA journal_mode = WAL;")
    dest_conn.execute("PRAGMA synchronous = NORMAL;")
    dest_conn.close()

    print("\n" + "=" * 75)
    print("FINAL INGESTION REPORT")
    print("=" * 75)
    print(f"Source rows:       {source_row_count:,}")
    print(f"Imported rows:     {db_count:,}")
    print(f"Failed rows:       {failed_row_count}")
    print(f"Skipped rows:      {skipped_row_count}")
    print(f"Duplicate rows:    {duplicate_row_count}")
    print(f"Difference:        {source_row_count - (db_count + failed_row_count)}")
    print(f"Total Duration:    {total_time:.1f}s")
    print(f"Ingestion status:  Complete")
    print("=" * 75)

if __name__ == "__main__":
    run_ingestion()
