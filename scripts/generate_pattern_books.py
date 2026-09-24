"""
Generate static JSON pattern book files for high-speed client-side filtering.
All 131,061 books across 31,164,973 records.
"""
import sqlite3
import json
import os
import time

def generate():
    t0 = time.time()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'database', 'data.db')
    out_dir = os.path.join(base_dir, 'frontend', 'public', 'data', 'patterns')
    os.makedirs(out_dir, exist_ok=True)

    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Identify all official nomadic tribe books indexed under Kochi province
    c.execute("SELECT DISTINCT book_name FROM records WHERE province = 'کوچی'")
    kochi_set = set(r[0] for r in c.fetchall())

    c.execute("""
        SELECT book_name, COUNT(*) as cnt
        FROM records
        WHERE book_name IS NOT NULL AND book_name != ''
        GROUP BY book_name
        ORDER BY cnt DESC
    """)
    books_raw = c.fetchall()
    conn.close()

    def classify_book(book_name: str) -> str:
        if not book_name:
            return 'other'
        norm = book_name.replace('\u200b', '').replace('\u200c', '').replace('\u200d', '').replace('\ufeff', '')
        if book_name in kochi_set or 'کوچی' in norm or 'عشایر' in norm:
            return 'kochi'
        if 'اساس' in norm or 'اصل ساس' in norm:
            return 'asas'
        if any(k in norm for k in ['قلم انداز', 'قلم‌انداز', 'قلم اندز', 'قلم اندار']):
            return 'qalam_andaz'
        if 'متفرقه' in norm:
            return 'motafariqa'
        if 'تولدات' in norm:
            return 'births'
        return 'other'

    def is_copy(b: str) -> bool:
        return 'نقل' in b or 'کاپی' in b

    def is_pmu(b: str) -> bool:
        return any(k in b for k in ['پی ام یو', 'پی‌ام‌یو', 'PMU'])

    categories = {
        'all': [],
        'qalam_andaz': [],
        'asas': [],
        'motafariqa': [],
        'births': [],
        'kochi': [],
        'other': []
    }

    total_recs = 31164973

    for b_name, cnt in books_raw:
        cat = classify_book(b_name)
        item = {
            'book_name': b_name,
            'province': 'کوچی' if cat == 'kochi' else '',
            'records_count': cnt,
            'unique_pages': max(1, round(cnt / 50)),
            'percentage': round((cnt / total_recs) * 100, 4),
            'category': cat,
            'is_copy': is_copy(b_name),
            'is_pmu': is_pmu(b_name)
        }
        categories['all'].append(item)
        categories[cat].append(item)

    for cat_name, items in categories.items():
        p = os.path.join(out_dir, f"{cat_name}.json")
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False)
        print(f"Generated {p} ({len(items)} volumes, {os.path.getsize(p)/(1024*1024):.2f} MB)")

    print(f"Done in {time.time()-t0:.2f}s")

if __name__ == '__main__':
    generate()
