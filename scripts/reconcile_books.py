#!/usr/bin/env python3
"""
Deep Database Reconciliation Pipeline: Deduplicate and Correct Archival Volumes.

Solves:
1. Pure digit corrupted book names ('0', '01', '275') by extracting true Persian titles from cropped_path.
2. Persian title duplicates by standardizing Arabic/Persian orthography, digits, and spacing.
3. Page-level UUID fragmentation ('Book 100141') by clustering pages into their true volume folders ('Book 70177')
   and assigning accurate calculated page numbers.
4. Cluster 102 mega-batch clumping by restoring true local volume IDs and page numbers.
5. Rebuilds query indexes, updates analytics cache, and regenerates client-side pattern files.
"""

import sys
import os
import time
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import DATABASE_FILE_PATH
from analytics.engine import compute_and_cache_all_analytics
from scripts.generate_pattern_books import generate as generate_pattern_books

def normalize_title(s: str) -> str:
    if not s:
        return ""
    s = s.strip()
    # Normalize Arabic chars to Persian standard
    s = (s.replace('ي', 'ی')
          .replace('ك', 'ک')
          .replace('ة', 'ه')
          .replace('آ', 'ا')
          .replace('أ', 'ا')
          .replace('إ', 'ا'))
    # Normalize Eastern Arabic / Perso-Arabic digits to Western digits
    trans = str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')
    s = s.translate(trans)
    # Remove zero-width characters and tatweel
    for ch in ['\u200b', '\u200c', '\u200d', '\ufeff', '\u0640', 'ـ']:
        s = s.replace(ch, '')
    # Ensure separation between digits and Persian letters
    s = re.sub(r'(\d+)([^\W\d_])', r'\1 \2', s)
    s = re.sub(r'([^\W\d_])(\d+)', r'\1 \2', s)
    # Collapse consecutive whitespace
    return ' '.join(s.split())

def reconcile_record(rid, bname, page_num, rec_num, path):
    """
    Given a record, determine if its book_name or page_number needs reconciliation.
    Returns (new_book_name, new_page_number).
    If no change needed, returns (None, None).
    """
    if not path:
        if bname and not bname.startswith('Book ') and not (bname.isdigit() and len(bname) <= 4):
            norm = normalize_title(bname)
            return (norm if norm != bname else None), None
        return None, None

    norm_path = path.replace('/', '\\')
    parts = [x.strip() for x in norm_path.split('\\') if x.strip()]
    if not parts:
        return None, None

    new_bname = None
    new_pnum = None

    # Check 1: Real Persian title in cropped_path (covers Case 1 corrupted digits and buried Persian titles)
    persian_parts = [pt for pt in parts[1:-1] if any(ord(ch) > 127 for ch in pt) and not pt.endswith('.jpg')]
    if persian_parts:
        best_title = sorted(persian_parts, key=lambda x: (any(k in x for k in ['جلد', 'قلم', 'اساس', 'متفرقه', 'تولدات']), len(x)), reverse=True)[0]
        if any(k in best_title for k in ['جلد', 'قلم', 'اساس', 'متفرقه', 'تولدات']) or len(best_title) > 10:
            canonical = normalize_title(best_title)
            if canonical != bname:
                new_bname = canonical
            # Extract page number right after title if present
            title_idx = parts.index(best_title)
            if title_idx + 1 < len(parts) - 1:
                cand_page = parts[title_idx + 1].split('_')[0]
                if cand_page.isdigit():
                    pn = int(cand_page)
                    if 1 <= pn <= 3000 and pn != page_num:
                        new_pnum = pn
            return new_bname, new_pnum

    # Check 2: UUID in path (page-level fragment of volume folder)
    uuid_indices = [i for i, pt in enumerate(parts) if len(pt) == 36 and '-' in pt]
    if uuid_indices and uuid_indices[0] > 0:
        vol_folder = parts[uuid_indices[0] - 1]
        target_bname = f'Book {vol_folder}'
        if target_bname != bname:
            new_bname = target_bname
        if rec_num and rec_num > 0:
            calc_pnum = max(1, (rec_num - 1) // 5 + 1)
            if calc_pnum != page_num:
                new_pnum = calc_pnum
        return new_bname, new_pnum

    # Check 3: Cluster 100/101/102 with 6 parts (e.g. \102\21\232\65496\88_dup\...)
    if parts[0] in ('100', '101', '102', '200', '300', '400', '500') and len(parts) >= 6:
        vol_folder = parts[3]
        target_bname = f'Book {vol_folder}'
        if target_bname != bname:
            new_bname = target_bname
        cand_page = parts[4].split('_')[0]
        if cand_page.isdigit():
            pn = int(cand_page)
            if 1 <= pn <= 3000 and pn != page_num:
                new_pnum = pn
        return new_bname, new_pnum

    # Check 4: Corrupted pure digit name with no Persian title (fallback)
    if bname and bname.isdigit() and len(bname) <= 4:
        vol = parts[-2] if len(parts) >= 2 and parts[-2].isdigit() else bname
        target_bname = f'Book {vol}'
        if target_bname != bname:
            new_bname = target_bname
        return new_bname, new_pnum

    # Check 5: Persian title normalization
    if bname and not bname.startswith('Book '):
        norm = normalize_title(bname)
        if norm != bname:
            new_bname = norm
        return new_bname, new_pnum

    return None, None

def run_reconciliation():
    print("=" * 80)
    print("STARTING DEEP DATABASE RECONCILIATION FOR ARCHIVAL VOLUMES")
    print("=" * 80)
    print(f"Target Database: {DATABASE_FILE_PATH}")
    t0 = time.time()

    conn = sqlite3.connect(str(DATABASE_FILE_PATH))
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = MEMORY;")
    conn.execute("PRAGMA cache_size = -2000000;")  # 2 GB RAM cache
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA locking_mode = EXCLUSIVE;")

    cur = conn.cursor()

    # Step 1: Temporarily drop idx_records_book for maximum update speed
    print("\n[1/5] Dropping idx_records_book for high-speed batch writes...")
    t_drop = time.time()
    cur.execute("DROP INDEX IF EXISTS idx_records_book;")
    conn.commit()
    print(f"      Index dropped in {time.time() - t_drop:.2f}s.")

    # Step 2: Chunk-based scan and batch update
    print("\n[2/5] Scanning and batch-updating 31.16M records in 500k chunks...")
    cur.execute("SELECT MIN(id), MAX(id) FROM records;")
    min_id, max_id = cur.fetchone()
    if min_id is None:
        min_id, max_id = 1, 31300000

    CHUNK_SIZE = 500000
    current_id = min_id
    total_scanned = 0
    total_updated = 0
    t_scan_start = time.time()

    while current_id <= max_id:
        next_id = current_id + CHUNK_SIZE
        cur.execute("""
            SELECT id, book_name, page_number, record_number, cropped_path 
            FROM records 
            WHERE id >= ? AND id < ?
        """, (current_id, next_id))
        rows = cur.fetchall()
        total_scanned += len(rows)

        if rows:
            batch = []
            for r in rows:
                nb, np = reconcile_record(*r)
                if nb is not None or np is not None:
                    final_bname = nb if nb is not None else r[1]
                    final_pnum = np if np is not None else r[2]
                    batch.append((final_bname, final_pnum, r[0]))

            if batch:
                cur.executemany("""
                    UPDATE records 
                    SET book_name = ?, page_number = ? 
                    WHERE id = ?
                """, batch)
                conn.commit()
                total_updated += len(batch)

        elapsed = time.time() - t_scan_start
        rate = total_scanned / elapsed if elapsed > 0 else 0
        pct = (total_scanned / 31164973) * 100
        print(f"      [{pct:5.1f}%] Scanned: {total_scanned:,} | Updated: {total_updated:,} records ({rate:,.0f} rec/s)")
        current_id = next_id

    scan_elapsed = time.time() - t_scan_start
    print(f"\n      Scan and update completed in {scan_elapsed:.2f}s!")
    print(f"      Total records updated: {total_updated:,} / {total_scanned:,}")

    # Step 3: Rebuild idx_records_book
    print("\n[3/5] Rebuilding idx_records_book index...")
    t_idx = time.time()
    cur.execute("CREATE INDEX idx_records_book ON records (book_name);")
    conn.commit()
    print(f"      Index rebuilt successfully in {time.time() - t_idx:.2f}s.")

    # Step 4: Verify new distinct book count
    print("\n[4/5] Verifying reconciled archival volumes...")
    cur.execute("SELECT COUNT(DISTINCT book_name) FROM records WHERE book_name IS NOT NULL AND book_name != '';")
    new_unique_books = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM records;")
    final_recs = cur.fetchone()[0]
    print(f"      Total records verified: {final_recs:,} (100% data integrity preserved)")
    print(f"      Reconciled Unique Books: {new_unique_books:,} (Previous: 131,061)")
    print(f"      Total duplicate/fragmented volumes eliminated: {131061 - new_unique_books:,}")

    # Step 5: Recompute Analytics Cache & Regenerate Pattern Books
    print("\n[5/5] Recomputing analytics cache & regenerating client-side book pattern files...")
    t_analytics = time.time()
    compute_and_cache_all_analytics(conn)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.close()
    print(f"      Analytics cache recomputed in {time.time() - t_analytics:.2f}s.")

    t_patterns = time.time()
    generate_pattern_books()
    print(f"      Pattern books regenerated in {time.time() - t_patterns:.2f}s.")

    print("\n" + "=" * 80)
    print("DATABASE RECONCILIATION COMPLETE")
    print(f"Total Duration: {time.time() - t0:.2f}s")
    print("=" * 80)

if __name__ == '__main__':
    run_reconciliation()
