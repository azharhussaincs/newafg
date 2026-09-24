"""
Reference Dataset Seeder for RTP Relief Registry, IVP Security Accounts, and Biometric Vectors
Populates initial database records matching reference schema if tables are empty.
"""

import sqlite3
import random
import json
import hashlib
from datetime import datetime
from backend.database import get_db_connection
from backend.services.biometrics_service import generate_deterministic_vector

def seed_rtp_records(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM rtp_records")
    cnt = cursor.fetchone()[0]
    if cnt >= 500:
        print(f"[RTP] Table already has {cnt} records. Skipping seeding.")
        return

    print(f"[RTP] Seeding representative records for humanitarian relief registry...")
    
    first_names = [
        "همدم", "ظریفه", "انصار الله", "ریاض", "سمیع الله", "خیرالله", "نعیمه", "نعیم",
        "عبدالقدوس", "عبدالله", "بلال", "محمد شاه", "شیرین آغا", "عبدالمجید", "همایون",
        "بختاور", "عبدالخالق", "سحر گل", "محمد ناصر", "عبدالصبور", "جمعه خان", "ناجیه",
        "عبدالسلام", "سباون", "عزت الله", "شیر آقا", "نورضیا", "میرا گل", "عرفان",
        "نور بی بی", "محمد طاهر", "راز محمد", "حمیرا", "احمدفرهاد", "زاهدالله", "محمد جاوید",
        "نگینه", "عتیق الله", "داود شاه", "احمد", "محمد", "علی", "عبدالواحد", "اکبر"
    ]
    father_names = [
        "عبدالواحد", "لالا شیرین", "ذکرالله", "مومن جان", "محمد شاه", "شیرین آغا",
        "یاقوت", "بارکزی", "پادشاه خان", "صمد خان", "الله محمد", "جنت گل", "بسم الله",
        "فضل", "فقیر", "انور", "کریم", "غلام", "سلطان", "نادر", "حبیب"
    ]
    gfather_names = [
        "در محمد", "مومن جان", "عبدالمجید", "اخوند", "سید اکبر", "ارباب غلام",
        "حاجی رحیم", "میرزا خان", "ملک دین محمد", "خان جان"
    ]
    jobs = [
        ("بی بضاعت", 25),
        ("بیکار", 15),
        ("کارگر", 15),
        ("غریبکار", 12),
        ("غریب کار", 10),
        ("دست فروش", 8),
        ("بیوه", 6),
        ("غریب", 5),
        ("کراچی وان", 4)
    ]
    job_pool = [j[0] for j in jobs for _ in range(j[1])]

    provinces = ["کابل", "کابل", "کابل", "کابل", "هرات", "بلخ", "ننگرهار", "کندز", "کندهار", "لوگر"]
    gozars = [
        "قلعه فتح الله", "کارته سه", "دشت برچی", "خیرخانه", "چهاردهی", "افشار",
        "پل سوخته", "مکروریان", "کوته سنگی", "شیرپور", "قلعه زمان خان", "وزیر آباد"
    ]

    records_to_insert = []
    start_pid = 1001 + cnt
    for i in range(1200):
        pid = start_pid + i
        name = random.choice(first_names)
        fname = random.choice(father_names)
        gfname = random.choice(gfather_names)
        job = random.choice(job_pool)
        family_count = random.choices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12], weights=[2, 3, 8, 12, 30, 25, 10, 5, 3, 1, 1])[0]
        bread_count = 0 if job in ["ثبت شده"] else (10 if family_count >= 5 else 6)
        worker = 0 if job in ["بیکار", "بیوه"] else random.choice([1, 1, 1, 2])
        income = "0" if job in ["بی بضاعت", "بیکار", "بیوه"] else str(random.choice([2500, 3500, 4500, 6000]))
        nahya = f"ناحیه {random.randint(1, 22)}"
        gozar = random.choice(gozars)
        prov = random.choice(provinces)
        phone = f"07{random.choice(['0', '7', '8', '9'])}{random.randint(1000000, 9999999)}"
        tazkira = f"KBL-{random.randint(100000, 999999)}"

        records_to_insert.append((
            f"FILE-2024-{random.randint(100, 999)}",
            pid,
            f"SER-{random.randint(10, 99)}",
            str(random.randint(100, 999)),
            name,
            fname,
            gfname,
            tazkira,
            job,
            family_count,
            nahya,
            gozar,
            bread_count,
            worker,
            income,
            "تایید شده (Active)",
            phone,
            phone,
            f"دکان نانوایی گذر {gozar}",
            prov,
            "NSIA-RTP-SURVEY-2024",
            f"سروی توزیع کمک غذایی اضطراری ناحیه {nahya} گذر {gozar}"
        ))

    cursor.executemany("""
    INSERT INTO rtp_records (
        file_id, pid, serial, number, name, fname, gfname, tazkira,
        job, family_count, nahya, gozar, bread_count, worker, income,
        status, phone, phone_copy, shop, province_id, datasource_id, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records_to_insert)
    conn.commit()
    print(f"[RTP] Successfully inserted {len(records_to_insert)} records.")

def seed_ivp_auth(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM ivp_auth")
    cnt = cursor.fetchone()[0]
    if cnt >= 100:
        print(f"[IVP] Table already has {cnt} accounts. Skipping seeding.")
        return

    print(f"[IVP] Seeding operator security accounts...")
    
    # 1. Primary Root Administrator
    cursor.execute("""
    INSERT INTO ivp_auth (
        username, normalized_username, email, normalized_email, email_confirmed,
        password_hash, security_stamp, concurrency_stamp, phone_number,
        phone_number_confirmed, two_factor_enabled, lockout_end, lockout_enabled,
        access_failed_count, first_name, last_name, office_id, disabled, is_admin,
        request_source_id, created_on, created_by, modified_on, modified_by
    ) VALUES (
        'sysadmin', 'SYSADMIN', 'admin@nsia.gov.af', 'ADMIN@NSIA.GOV.AF', 1,
        'AQAAAAEAACcQAAAAEGb6cT5Z1K9Z4W8L7V2N3X5M1P0Q8R7S6T5U4V3W2X1Y0Z9A8B7C6D5E4F3==',
        'SEC-STAMP-NSIA-ROOT-001', 'CONCUR-STAMP-ROOT-2024', '0700112233',
        1, 1, NULL, 0, 0, 'احمد', 'محمودی', 104, 0, 1,
        'NSIA_CENTRAL_HQ', '2023-01-15 08:30:00', 'SUPERUSER', '2024-08-10 12:00:00', 'SYSADMIN'
    )
    """)

    # 2. Operators across branch offices
    first_names = ["محمد", "احمد", "علی", "فرید", "همایون", "وحید", "کریم", "حسین", "ظریفه", "نعیمه", "مریم", "فاطمه"]
    last_names = ["محمودی", "نوری", "کریمی", "احمدی", "بارکزی", "پوپلزی", "افغان", "امیری", "صدیقی", "هاشمی"]
    offices = [104, 1, 156, 4, 129, 2, 5, 8, 12, 18, 22, 30]

    operators = []
    for i in range(1, 250):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        usr = f"operator_{i}"
        office = random.choice(offices)
        disabled = 1 if (i % 5 == 0) else 0
        phone = f"07{random.choice(['0', '7', '8', '9'])}{random.randint(1000000, 9999999)}"
        email = f"op_{i}@ivp.nsia.gov.af"
        pwd_hash = hashlib.sha256(f"secret_{i}".encode()).hexdigest()

        operators.append((
            usr, usr.upper(), email, email.upper(), 1,
            pwd_hash, f"STAMP-{i:04d}", f"CONC-{i:04d}", phone,
            1, 0, None, 1, 0 if disabled == 0 else random.randint(1, 4),
            fn, ln, office, disabled, 0,
            f"BRANCH_OFFICE_{office}", "2023-05-10 09:00:00", "SYSADMIN", "2024-02-18 15:45:00", "SYSADMIN"
        ))

    cursor.executemany("""
    INSERT INTO ivp_auth (
        username, normalized_username, email, normalized_email, email_confirmed,
        password_hash, security_stamp, concurrency_stamp, phone_number,
        phone_number_confirmed, two_factor_enabled, lockout_end, lockout_enabled,
        access_failed_count, first_name, last_name, office_id, disabled, is_admin,
        request_source_id, created_on, created_by, modified_on, modified_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, operators)
    conn.commit()
    print(f"[IVP] Successfully inserted {len(operators) + 1} security accounts.")

def seed_face_vectors(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM face_vectors")
    cnt = cursor.fetchone()[0]
    if cnt >= 500:
        print(f"[Face Vectors] Table already has {cnt} entries. Skipping seeding.")
        return

    print(f"[Face Vectors] Seeding initial vectors from primary records...")
    cursor.execute("SELECT id, cropped_path FROM records LIMIT 2000")
    recs = cursor.fetchall()
    
    vec_data = []
    for r in recs:
        rid = r["id"]
        v = generate_deterministic_vector(rid)
        p = r["cropped_path"] or f"archive/face_{rid}.jpg"
        vec_data.append((rid, p, json.dumps(v), "eye_l,eye_r,nose,mouth_l,mouth_r"))

    cursor.executemany("""
    INSERT INTO face_vectors (record_id, path, vector, landmark)
    VALUES (?, ?, ?, ?)
    """, vec_data)
    conn.commit()
    print(f"[Face Vectors] Successfully populated {len(vec_data)} vector embeddings.")

if __name__ == "__main__":
    conn = get_db_connection()
    seed_rtp_records(conn)
    seed_ivp_auth(conn)
    seed_face_vectors(conn)
    conn.close()
    print("All reference data seeded successfully.")
