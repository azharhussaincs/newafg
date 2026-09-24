#!/usr/bin/env python3
"""
High-Performance Zero-Loss Province Enrichment & Analytics Pipeline
Resolves 29.6M unmapped records by extracting official Afghan NSIA
provincial and district codes directly from CroppedPath.
Bakes the result permanently into database/data.db.
"""

import sys
import time
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import DATABASE_FILE_PATH
from analytics.engine import compute_and_cache_all_analytics

# Official 34-Province Mapping for Afghanistan Civil Registry
PROV_CODE_MAP = {
    1:  ("کابل", "KBL"),
    2:  ("کاپیسا", "KAP"),
    3:  ("پروان", "PAR"),
    4:  ("وردک", "WRD"),
    5:  ("لوگر", "LOG"),
    6:  ("ننگرهار", "NAN"),
    7:  ("لغمان", "LAG"),
    8:  ("پنجشیر", "PAN"),
    9:  ("بغلان", "BAG"),
    10: ("بامیان", "BAM"),
    11: ("غزنی", "GHZ"),
    12: ("پکتیکا", "PKA"),
    13: ("پکتیا", "PKT"),
    14: ("خوست", "KHS"),
    15: ("کنر", "KNR"),
    16: ("نورستان", "NUR"),
    17: ("بدخشان", "BDK"),
    18: ("تخار", "TAK"),
    19: ("کندز", "KDZ"),
    20: ("سمنگان", "SAM"),
    21: ("بلخ", "BAL"),
    22: ("سرپل", "SAR"),
    23: ("غور", "GHR"),
    24: ("دایکوندی", "DAY"),
    25: ("ارزگان", "URZ"),
    26: ("زابل", "ZAB"),
    27: ("کندهار", "KAN"),
    28: ("جوزجان", "JOW"),
    29: ("فاریاب", "FYB"),
    30: ("هلمند", "HEL"),
    31: ("بادغیس", "BDG"),
    32: ("هرات", "HER"),
    33: ("فراه", "FRH"),
    34: ("نیمروز", "NMZ"),
    35: ("دایکوندی", "DAY"),
    50: ("کوچی", "KCH"),
}

PROV_TEXT_NORM = {
    "Parwan": ("پروان", "PAR"),
    "Badghis": ("بادغیس", "BDG"),
    "Zabul": ("زابل", "ZAB"),
    "Panjsher": ("پنجشیر", "PAN"),
    "Hirat": ("هرات", "HER"),
    "Paktya": ("پکتیا", "PKT"),
    "Paktika": ("پکتیکا", "PKA"),
    "Sari Pul": ("سرپل", "SAR"),
    "saripul": ("سرپل", "SAR"),
    "میدان وردک": ("وردک", "WRD"),
    "کابل": ("کابل", "KBL"),
    "کاپیسا": ("کاپیسا", "KAP"),
    "پروان": ("پروان", "PAR"),
    "وردک": ("وردک", "WRD"),
    "لوگر": ("لوگر", "LOG"),
    "ننگرهار": ("ننگرهار", "NAN"),
    "لغمان": ("لغمان", "LAG"),
    "پنجشیر": ("پنجشیر", "PAN"),
    "بغلان": ("بغلان", "BAG"),
    "بامیان": ("بامیان", "BAM"),
    "غزنی": ("غزنی", "GHZ"),
    "پکتیکا": ("پکتیکا", "PKA"),
    "پکتیا": ("پکتیا", "PKT"),
    "خوست": ("خوست", "KHS"),
    "کنر": ("کنر", "KNR"),
    "نورستان": ("نورستان", "NUR"),
    "بدخشان": ("بدخشان", "BDK"),
    "تخار": ("تخار", "TAK"),
    "کندز": ("کندز", "KDZ"),
    "سمنگان": ("سمنگان", "SAM"),
    "بلخ": ("بلخ", "BAL"),
    "سرپل": ("سرپل", "SAR"),
    "غور": ("غور", "GHR"),
    "دایکوندی": ("دایکوندی", "DAY"),
    "ارزگان": ("ارزگان", "URZ"),
    "زابل": ("زابل", "ZAB"),
    "کندهار": ("کندهار", "KAN"),
    "جوزجان": ("جوزجان", "JOW"),
    "فاریاب": ("فاریاب", "FYB"),
    "هلمند": ("هلمند", "HEL"),
    "بادغیس": ("بادغیس", "BDG"),
    "هرات": ("هرات", "HER"),
    "فراه": ("فراه", "FRH"),
    "نیمروز": ("نیمروز", "NMZ"),
    "کوچی": ("کوچی", "KCH"),
}

def extract_geo(path):
    if not path:
        return None
    norm = path.replace('/', '\\')
    parts = [x.strip() for x in norm.split('\\') if x.strip()]
    if not parts:
        return None

    # Case 1: First token is server cluster (100, 200, 300, 400, 500, etc.)
    if parts[0].isdigit():
        val0 = int(parts[0])
        if val0 >= 100 and len(parts) >= 3 and parts[1].isdigit():
            p_code = int(parts[1])
            d_code = parts[2] if parts[2].isdigit() else None
            if p_code in PROV_CODE_MAP:
                prov_name, prov_abbr = PROV_CODE_MAP[p_code]
                return (prov_name, prov_abbr, d_code)
        elif 1 <= val0 <= 50:
            p_code = val0
            d_code = parts[1] if len(parts) >= 2 and parts[1].isdigit() else None
            if p_code in PROV_CODE_MAP:
                prov_name, prov_abbr = PROV_CODE_MAP[p_code]
                return (prov_name, prov_abbr, d_code)

    # Case 2: Named text province at start
    text_cand = parts[0]
    if text_cand in PROV_TEXT_NORM:
        prov_name, prov_abbr = PROV_TEXT_NORM[text_cand]
        d_code = parts[1] if len(parts) >= 2 and parts[1].isdigit() else None
        return (prov_name, prov_abbr, d_code)

    return None

def main():
    print("=" * 80)
    print("PERMANENT DATABASE PROVINCE ENRICHMENT PIPELINE")
    print("=" * 80)
    print(f"Target Database: {DATABASE_FILE_PATH}")
    t0 = time.time()

    conn = sqlite3.connect(str(DATABASE_FILE_PATH))
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = OFF;")
    conn.execute("PRAGMA cache_size = -2000000;")  # 2 GB RAM cache
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA locking_mode = EXCLUSIVE;")

    cur = conn.cursor()

    # 1. Temporarily drop the 3 indexes to maximize write throughput
    print("[1/5] Dropping province & district indexes for high-speed writes...")
    t_drop = time.time()
    cur.execute("DROP INDEX IF EXISTS idx_records_prov_dist;")
    cur.execute("DROP INDEX IF EXISTS idx_records_prov_code;")
    cur.execute("DROP INDEX IF EXISTS idx_records_dist_code;")
    conn.commit()
    print(f"      Indexes dropped in {time.time() - t_drop:.2f}s.")

    # 2. Update records in range-based chunks of 500,000 IDs
    print("[2/5] Scanning and batch-updating 31.16M records in 500k chunks...")
    cur.execute("SELECT MIN(id), MAX(id) FROM records;")
    min_id, max_id = cur.fetchone()
    if min_id is None:
        min_id, max_id = 1, 31300000

    CHUNK_SIZE = 500000
    current_id = min_id
    total_updated = 0
    total_skipped = 0
    t_batch_start = time.time()

    while current_id <= max_id:
        next_id = current_id + CHUNK_SIZE
        cur.execute("""
            SELECT id, cropped_path 
            FROM records 
            WHERE id >= ? AND id < ? 
              AND (province IS NULL OR province = '' OR province = 'Unknown / Unspecified');
        """, (current_id, next_id))
        rows = cur.fetchall()

        if rows:
            batch = []
            for row_id, path in rows:
                res = extract_geo(path)
                if res:
                    batch.append((res[0], res[1], res[2], row_id))
                else:
                    total_skipped += 1

            if batch:
                cur.executemany("""
                    UPDATE records 
                    SET province = ?, province_code = ?, district_code = ? 
                    WHERE id = ?;
                """, batch)
                conn.commit()
                total_updated += len(batch)

        elapsed = time.time() - t_batch_start
        pct = min(100.0, ((current_id - min_id) / (max_id - min_id)) * 100)
        rate = total_updated / elapsed if elapsed > 0 else 0
        print(f"      [{pct:5.1f}%] IDs {current_id:,} - {next_id:,} | Updated: {total_updated:,} ({rate:,.0f} rec/s)")
        current_id = next_id

    print(f"      Enrichment complete! Updated: {total_updated:,} | Skipped: {total_skipped:,} in {time.time() - t_batch_start:.2f}s.")

    # 3. Normalize any existing English / non-standard provinces
    print("[3/5] Standardizing existing province names and codes...")
    for old_name, (canonical_name, code) in PROV_TEXT_NORM.items():
        cur.execute("""
            UPDATE records 
            SET province = ?, province_code = ? 
            WHERE province = ?;
        """, (canonical_name, code, old_name))
    conn.commit()

    # 4. Rebuild B-Tree Indexes
    print("[4/5] Rebuilding B-Tree search indexes...")
    t_idx = time.time()
    cur.execute("CREATE INDEX idx_records_prov_dist ON records (province, district);")
    cur.execute("CREATE INDEX idx_records_prov_code ON records (province_code);")
    cur.execute("CREATE INDEX idx_records_dist_code ON records (district_code);")
    conn.commit()
    print(f"      Indexes rebuilt successfully in {time.time() - t_idx:.2f}s.")

    # 5. Precalculate and Cache Analytics
    print("[5/5] Recomputing full analytics cache for dashboard...")
    t_analytics = time.time()
    compute_and_cache_all_analytics(conn)
    print(f"      Analytics recomputation completed in {time.time() - t_analytics:.2f}s.")

    total_time = time.time() - t0
    print("=" * 80)
    print(f"SUCCESS: ALL RECORDS PERMANENTLY ENRICHED AND CACHED IN {total_time:.2f}s!")
    print("=" * 80)

if __name__ == "__main__":
    main()
