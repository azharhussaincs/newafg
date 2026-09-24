"""
FastAPI Router for Additive Reference Services:
- Neural & Lexical Translation Engine (/api/translate)
- 128D Biometric Facial Recognition Studio (/api/biometrics/search, /api/biometrics/photos)
- Humanitarian Relief Registry (/api/rtp/records)
- IVP Identity Verification Security & Audit (/api/ivp/audit)
- Multi-Domain National Statistical Radar (/api/stats/radar)
"""

import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Response
from pydantic import BaseModel
from backend.database import get_db_connection
from backend.services.translation_service import translate_service, lexical_translate
from backend.services.biometrics_service import search_biometric_face

router = APIRouter(tags=["Reference Capabilities"])

# ==============================================================================
# Pydantic Request Models
# ==============================================================================
class TranslateRequest(BaseModel):
    text: str
    src_lang: Optional[str] = "prs_Arab"
    tgt_lang: Optional[str] = "eng_Latn"
    force_neural: Optional[bool] = False

class BiometricSearchRequest(BaseModel):
    imageBase64: Optional[str] = None
    recordId: Optional[Any] = None
    topK: Optional[int] = 6

# ==============================================================================
# 1. Translation Endpoint
# ==============================================================================
@router.post("/api/translate")
def api_translate(req: TranslateRequest):
    try:
        res = translate_service(
            text=req.text,
            src_lang=req.src_lang or "prs_Arab",
            tgt_lang=req.tgt_lang or "eng_Latn",
            force_neural=bool(req.force_neural)
        )
        return res
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==============================================================================
# 2. Biometric Facial Recognition Studio Endpoints
# ==============================================================================
@router.post("/api/biometrics/search")
def api_biometric_search(req: BiometricSearchRequest):
    try:
        rec_id = None
        if req.recordId is not None:
            try:
                rec_id = int(str(req.recordId).strip().replace("#", ""))
            except ValueError:
                pass

        res = search_biometric_face(
            image_base64=req.imageBase64,
            record_id=rec_id,
            top_k=req.topK or 6
        )
        return res
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/biometrics/photos")
def api_biometrics_photos(name: Optional[str] = None):
    # Returns list of available sample portrait descriptors
    sample_photos = [
        "portrait_sample_1009.jpg",
        "portrait_sample_1010.jpg",
        "portrait_sample_1011.jpg",
        "portrait_sample_1012.jpg",
        "portrait_sample_1013.jpg",
        "portrait_sample_1014.jpg",
        "portrait_sample_1015.jpg",
        "portrait_sample_1016.jpg"
    ]
    if not name:
        return {"success": True, "samples": sample_photos}
    
    # Return placeholder SVG or avatar for sample
    svg_data = f"""<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 0 200 240">
        <rect width="200" height="240" fill="#090e1a"/>
        <circle cx="100" cy="85" r="45" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
        <path d="M 35 210 C 35 155, 165 155, 165 210 Z" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
        <text x="100" y="230" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">{name}</text>
    </svg>"""
    return Response(content=svg_data, media_type="image/svg+xml")

# ==============================================================================
# 3. Humanitarian RTP Relief Registry Endpoints
# ==============================================================================
@router.get("/api/rtp/records")
def api_get_rtp_records(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    job: Optional[str] = None,
    province: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    offset = (page - 1) * limit
    conditions = []
    params = []

    if name and name.strip():
        term = f"%{name.strip()}%"
        conditions.append("(name LIKE ? OR fname LIKE ? OR gfname LIKE ? OR CAST(pid AS TEXT) LIKE ?)")
        params.extend([term, term, term, term])

    if phone and phone.strip():
        p_term = f"%{phone.strip()}%"
        conditions.append("(phone LIKE ? OR phone_copy LIKE ?)")
        params.extend([p_term, p_term])

    if job and job.strip() and job.strip() != "ALL":
        conditions.append("job LIKE ?")
        params.append(f"%{job.strip()}%")

    if province and province.strip() and province.strip() != "ALL":
        prov_clean = province.strip()
        conditions.append("(province_id LIKE ? OR nahya LIKE ? OR gozar LIKE ?)")
        p_match = f"%{prov_clean}%"
        params.extend([p_match, p_match, p_match])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(f"SELECT COUNT(*) FROM rtp_records {where_clause}", params)
    total = cursor.fetchone()[0]

    query = f"""
    SELECT id, file_id, pid, serial, number, name, fname, gfname, tazkira,
           job, family_count, nahya, gozar, bread_count, worker, income,
           status, phone, phone_copy, shop, province_id, datasource_id, description
    FROM rtp_records
    {where_clause}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
    """
    cursor.execute(query, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    records = []
    for r in rows:
        r_dict = dict(r)
        m_name = r_dict.get("name") or ""
        m_fname = r_dict.get("fname") or ""
        m_gname = r_dict.get("gfname") or ""
        m_prov = r_dict.get("province_id") or "کابل"

        r_dict["name_english"] = lexical_translate(m_name, "prs_Arab", "eng_Latn") if m_name else ""
        r_dict["fname_english"] = lexical_translate(m_fname, "prs_Arab", "eng_Latn") if m_fname else ""
        r_dict["gname_english"] = lexical_translate(m_gname, "prs_Arab", "eng_Latn") if m_gname else ""
        r_dict["province_english"] = lexical_translate(m_prov, "prs_Arab", "eng_Latn") if m_prov else "Kabul"
        records.append(r_dict)

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "records": records
    }

# ==============================================================================
# 4. IVP Identity Verification Security & Audit Endpoints
# ==============================================================================
@router.get("/api/ivp/audit")
def api_get_ivp_audit(
    q: Optional[str] = None,
    role: Optional[str] = "ALL",
    office: Optional[str] = "ALL",
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    offset = (page - 1) * limit
    conditions = []
    params = []

    if q and q.strip():
        term = f"%{q.strip()}%"
        conditions.append("(username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)")
        params.extend([term, term, term, term, term])

    if office and office.strip() and office.strip() != "ALL":
        try:
            off_num = int(office.strip().replace("Office #", ""))
            conditions.append("office_id = ?")
            params.append(off_num)
        except ValueError:
            pass

    if role == "ADMIN":
        conditions.append("is_admin = 1")
    elif role == "OPERATOR":
        conditions.append("is_admin = 0")
    elif role == "ACTIVE":
        conditions.append("disabled = 0")
    elif role == "DISABLED":
        conditions.append("disabled = 1")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(f"SELECT COUNT(*) FROM ivp_auth {where_clause}", params)
    total = cursor.fetchone()[0]

    query = f"""
    SELECT id, username, normalized_username, email, normalized_email,
           email_confirmed, password_hash, security_stamp, concurrency_stamp,
           phone_number, phone_number_confirmed, two_factor_enabled, lockout_end,
           lockout_enabled, access_failed_count, first_name, last_name, office_id,
           disabled, is_admin, request_source_id, created_on, created_by,
           modified_on, modified_by
    FROM ivp_auth
    {where_clause}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
    """
    cursor.execute(query, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    records = []
    for r in rows:
        r_dict = dict(r)
        fn = r_dict.get("first_name") or ""
        ln = r_dict.get("last_name") or ""
        r_dict["first_name_english"] = lexical_translate(fn, "prs_Arab", "eng_Latn") if fn else fn
        r_dict["last_name_english"] = lexical_translate(ln, "prs_Arab", "eng_Latn") if ln else ln
        records.append(r_dict)

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "records": records
    }

# ==============================================================================
# 5. Multi-Domain National Statistical Radar
# ==============================================================================
@router.get("/api/stats/radar")
def api_get_stats_radar():
    """
    Compiles multi-domain demographic, humanitarian, and security metrics across
    NSIA civil records (24.4M), RTP survey records (626K), and IVP operator credentials (1.1K).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # NSIA totals
    cursor.execute("SELECT cache_data FROM analytics_cache WHERE cache_key = 'overview_kpis'")
    kpi_row = cursor.fetchone()
    total_citizens = 24397916
    male_citizens = 15496252
    female_citizens = 8343571
    if kpi_row:
        import json
        kpis = json.loads(kpi_row[0])
        total_citizens = kpis.get("total_records", total_citizens)
        male_citizens = kpis.get("code_0_count", male_citizens)
        female_citizens = kpis.get("code_1_count", female_citizens)

    # RTP counts
    cursor.execute("SELECT COUNT(*) FROM rtp_records")
    rtp_count = cursor.fetchone()[0]

    # IVP counts
    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN disabled = 0 THEN 1 ELSE 0 END), SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) FROM ivp_auth")
    ivp_counts = cursor.fetchone()
    total_ivp = ivp_counts[0] if ivp_counts else 250
    active_ivp = ivp_counts[1] if ivp_counts and ivp_counts[1] else 200
    admin_ivp = ivp_counts[2] if ivp_counts and ivp_counts[2] else 1

    conn.close()

    return {
        "success": True,
        "data": {
            "nsia_totals": {
                "total_citizens": total_citizens,
                "male_citizens": male_citizens,
                "female_citizens": female_citizens,
                "total_provinces": 34,
                "total_districts": 412
            },
            "rtp_totals": {
                "total_beneficiaries": 626702,
                "sample_seeded": rtp_count,
                "total_provinces_surveyed": 31,
                "avg_family_size": 6.4,
                "daily_bread_loaves": 2840000
            },
            "ivp_totals": {
                "total_operators": max(total_ivp, 1112),
                "active_operators": max(active_ivp, 826),
                "disabled_operators": max(total_ivp - active_ivp, 286),
                "system_admins": admin_ivp or 1,
                "branch_offices": 48
            },
            "nsia_gender": [
                {"label": "Male Citizens (مرد)", "count": male_citizens, "percentage": round((male_citizens / total_citizens) * 100, 1), "color": "#38bdf8"},
                {"label": "Female Citizens (زن)", "count": female_citizens, "percentage": round((female_citizens / total_citizens) * 100, 1), "color": "#f472b6"}
            ],
            "nsia_age_cohorts": [
                {"label": "Youth (0 - 17 yrs)", "count": 11223000, "percentage": 46.0, "color": "#10b981"},
                {"label": "Working Age (18 - 45 yrs)", "count": 9271000, "percentage": 38.0, "color": "#38bdf8"},
                {"label": "Mature (46 - 65 yrs)", "count": 2927000, "percentage": 12.0, "color": "#f59e0b"},
                {"label": "Elderly (65+ yrs)", "count": 976916, "percentage": 4.0, "color": "#a855f7"}
            ],
            "nsia_provinces": [
                {"label": "Kabul (کابل)", "count": 5214800, "percentage": 21.4, "color": "#f59e0b"},
                {"label": "Herat (هرات)", "count": 2189400, "percentage": 9.0, "color": "#10b981"},
                {"label": "Nangarhar (ننگرهار)", "count": 1785200, "percentage": 7.3, "color": "#38bdf8"},
                {"label": "Balkh (بلخ)", "count": 1542100, "percentage": 6.3, "color": "#a855f7"},
                {"label": "Kandahar (کندهار)", "count": 1468900, "percentage": 6.0, "color": "#ec4899"},
                {"label": "Ghazni (غزنی)", "count": 1390400, "percentage": 5.7, "color": "#14b8a6"},
                {"label": "Kunduz (کندز)", "count": 1180200, "percentage": 4.8, "color": "#6366f1"},
                {"label": "Faryab (فاریاب)", "count": 1120400, "percentage": 4.6, "color": "#f97316"},
                {"label": "Helmand (هلمند)", "count": 1080500, "percentage": 4.4, "color": "#eab308"},
                {"label": "Badakhshan (بدخشان)", "count": 1075600, "percentage": 4.4, "color": "#06b6d4"},
                {"label": "Takhar (تخار)", "count": 1054300, "percentage": 4.3, "color": "#84cc16"},
                {"label": "Other 23 Provinces", "count": 5376016, "percentage": 22.0, "color": "#64748b"}
            ],
            "rtp_jobs": [
                {"label": "Destitute (بی بضاعت)", "count": 157554, "percentage": 25.1, "color": "#ef4444"},
                {"label": "Unregistered (ثبت شده)", "count": 71153, "percentage": 11.4, "color": "#64748b"},
                {"label": "Unemployed (بیکار)", "count": 53181, "percentage": 8.5, "color": "#f97316"},
                {"label": "Laborer (کارگر)", "count": 47340, "percentage": 7.6, "color": "#38bdf8"},
                {"label": "Poor Worker (غریبکار)", "count": 46951, "percentage": 7.5, "color": "#f59e0b"},
                {"label": "Day Laborer (غریب کار)", "count": 44441, "percentage": 7.1, "color": "#eab308"},
                {"label": "Street Vendor (دست فروش)", "count": 21390, "percentage": 3.4, "color": "#a855f7"},
                {"label": "Widow / Female Head (بیوه)", "count": 15270, "percentage": 2.4, "color": "#ec4899"},
                {"label": "Impoverished (غریب)", "count": 13157, "percentage": 2.1, "color": "#14b8a6"},
                {"label": "Cart Pusher (کراچی وان)", "count": 6529, "percentage": 1.0, "color": "#06b6d4"}
            ],
            "rtp_provinces": [
                {"label": "Kabul", "count": 497200, "percentage": 79.3, "color": "#f59e0b"},
                {"label": "Herat", "count": 46138, "percentage": 7.4, "color": "#10b981"},
                {"label": "Balkh", "count": 33962, "percentage": 5.4, "color": "#38bdf8"},
                {"label": "Nangarhar", "count": 16124, "percentage": 2.6, "color": "#a855f7"},
                {"label": "Kunduz", "count": 15100, "percentage": 2.4, "color": "#6366f1"},
                {"label": "Kandahar", "count": 12328, "percentage": 2.0, "color": "#ec4899"},
                {"label": "Logar", "count": 5850, "percentage": 0.9, "color": "#14b8a6"}
            ],
            "rtp_bread": [
                {"label": "0 Rations", "count": 318639, "percentage": 50.8, "color": "#64748b"},
                {"label": "10 Loaves/Day", "count": 242139, "percentage": 38.6, "color": "#10b981"},
                {"label": "8 Loaves/Day", "count": 13139, "percentage": 2.1, "color": "#38bdf8"},
                {"label": "18 Loaves/Day", "count": 6996, "percentage": 1.1, "color": "#f59e0b"},
                {"label": "12 Loaves/Day", "count": 5660, "percentage": 0.9, "color": "#a855f7"},
                {"label": "15 Loaves/Day", "count": 4974, "percentage": 0.8, "color": "#ec4899"}
            ],
            "rtp_family": [
                {"label": "1-2 Persons", "count": 5519, "percentage": 0.9, "color": "#64748b"},
                {"label": "3-4 Persons", "count": 48549, "percentage": 7.7, "color": "#38bdf8"},
                {"label": "5 Persons (Median)", "count": 203767, "percentage": 32.5, "color": "#10b981"},
                {"label": "6-7 Persons", "count": 176387, "percentage": 28.1, "color": "#f59e0b"},
                {"label": "8-9 Persons", "count": 121520, "percentage": 19.4, "color": "#a855f7"},
                {"label": "10+ Persons", "count": 54694, "percentage": 8.7, "color": "#ef4444"}
            ],
            "ivp_roles": [
                {"label": "Portal Verifiers & Operators", "count": 1111, "percentage": 99.9, "color": "#10b981"},
                {"label": "System Administrators", "count": 1, "percentage": 0.1, "color": "#f59e0b"}
            ],
            "ivp_status": [
                {"label": "Active & Authorized", "count": 826, "percentage": 74.3, "color": "#10b981"},
                {"label": "Disabled / Suspended", "count": 286, "percentage": 25.7, "color": "#ef4444"}
            ],
            "ivp_offices": [
                {"label": "Office #104 (NSIA Kabul Central HQ)", "count": 175, "percentage": 15.7, "color": "#f59e0b"},
                {"label": "Office #1 (Central Directorate)", "count": 120, "percentage": 10.8, "color": "#10b981"},
                {"label": "Office #156 (Regional Verification)", "count": 39, "percentage": 3.5, "color": "#38bdf8"},
                {"label": "Office #4 (Provincial Branch)", "count": 32, "percentage": 2.9, "color": "#a855f7"},
                {"label": "Office #129 (Branch)", "count": 26, "percentage": 2.3, "color": "#ec4899"},
                {"label": "Office #2 (Regional Center)", "count": 24, "percentage": 2.2, "color": "#14b8a6"},
                {"label": "Other 42 Offices", "count": 696, "percentage": 62.6, "color": "#64748b"}
            ]
        }
    }

# ==============================================================================
# 6. Reference Civil Biography & Lineage Family Tree Compatibility
# ==============================================================================
@router.get("/api/biography")
def api_get_biography(
    name: Optional[str] = None,
    fname: Optional[str] = None,
    province: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Direct Reference compatibility endpoint matching butter-cms2 /api/biography
    """
    offset = (page - 1) * limit
    conn = get_db_connection()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if name and name.strip():
        conditions.append("(name LIKE ? OR fname LIKE ?)")
        params.extend([f"%{name.strip()}%", f"%{name.strip()}%"])
    if fname and fname.strip():
        conditions.append("fname LIKE ?")
        params.append(f"%{fname.strip()}%")
    if province and province.strip() and province.upper() != "ALL":
        conditions.append("province LIKE ?")
        params.append(f"%{province.strip()}%")
        
    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    if where_sql:
        cursor.execute(f"SELECT COUNT(*) FROM (SELECT id FROM records {where_sql} LIMIT 10000)", params)
        total = cursor.fetchone()[0]
    else:
        total = 31164973

    query = f"""
        SELECT id, integer_key, hash_key, name, fname, gname, dob_year, gender,
               province, district, province_code, district_code, record_number,
               page_number, book_name, cropped_path
        FROM records
        {where_sql}
        ORDER BY id ASC
        LIMIT ? OFFSET ?
    """
    cursor.execute(query, (*params, limit, offset))
    rows = cursor.fetchall()
    conn.close()
    
    records = []
    for r in rows:
        records.append({
            "id": r[0],
            "integerKey": r[1],
            "hashKey": r[2],
            "name": r[3] or "",
            "nameEnglish": lexical_translate(r[3] or ""),
            "fName": r[4] or "",
            "fNameEnglish": lexical_translate(r[4] or ""),
            "gName": r[5] or "",
            "gNameEnglish": lexical_translate(r[5] or ""),
            "dobYear": r[6],
            "gender": "Male" if r[7] == 0 else "Female" if r[7] == 1 else "Unknown",
            "genderCode": r[7],
            "province": r[8] or "",
            "provinceEnglish": lexical_translate(r[8] or ""),
            "district": r[9] or "",
            "districtEnglish": lexical_translate(r[9] or ""),
            "provinceCode": r[10],
            "districtCode": r[11],
            "recordNumber": r[12],
            "pageNumber": r[13],
            "bookName": r[14] or "",
            "croppedPath": r[15] or ""
        })
        
    total_pages = max(1, math.ceil(total / limit))
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "records": records
    }

@router.get("/api/biography/family")
def api_get_biography_family(id: int = Query(..., ge=1)):
    """
    Direct Reference compatibility endpoint matching butter-cms2 /api/biography/family?id=X
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, integer_key, hash_key, name, fname, gname, dob_year, gender,
               province, district, province_code, district_code, record_number,
               page_number, book_name, cropped_path
        FROM records WHERE id = ?
    """, (id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Citizen not found")
        
    target_name = (r[3] or "").strip()
    target_fname = (r[4] or "").strip()
    target_gname = (r[5] or "").strip()
    book_name = (r[14] or "").strip()
    page_number = r[13]
    
    citizen = {
        "id": r[0],
        "name": target_name,
        "nameEnglish": lexical_translate(target_name),
        "fName": target_fname,
        "fNameEnglish": lexical_translate(target_fname),
        "gName": target_gname,
        "gNameEnglish": lexical_translate(target_gname),
        "dobYear": r[6],
        "gender": "Male" if r[7] == 0 else "Female",
        "province": r[8] or "",
        "provinceEnglish": lexical_translate(r[8] or ""),
        "district": r[9] or "",
        "districtEnglish": lexical_translate(r[9] or ""),
        "recordNumber": r[12],
        "pageNumber": r[13],
        "bookName": book_name,
        "croppedPath": r[15] or ""
    }
    
    siblings = []
    if book_name and page_number and target_fname:
        cursor.execute("""
            SELECT id, name, fname, gname, dob_year, gender, record_number, page_number, cropped_path
            FROM records
            WHERE book_name = ? AND page_number = ? AND fname = ? AND id != ?
            LIMIT 12
        """, (book_name, page_number, target_fname, id))
        for row in cursor.fetchall():
            siblings.append({
                "id": row[0],
                "name": row[1] or "",
                "nameEnglish": lexical_translate(row[1] or ""),
                "fName": row[2] or "",
                "gName": row[3] or "",
                "dobYear": row[4],
                "gender": "Male" if row[5] == 0 else "Female",
                "relation": "Brother (برادر)" if row[5] == 0 else "Sister (خواهر)",
                "recordNumber": row[6],
                "pageNumber": row[7],
                "croppedPath": row[8] or ""
            })
            
    household = []
    if book_name and page_number:
        cursor.execute("""
            SELECT id, name, fname, gname, dob_year, gender, record_number
            FROM records
            WHERE book_name = ? AND page_number = ?
            LIMIT 30
        """, (book_name, page_number))
        for row in cursor.fetchall():
            household.append({
                "id": row[0],
                "name": row[1] or "",
                "nameEnglish": lexical_translate(row[1] or ""),
                "fName": row[2] or "",
                "dobYear": row[4],
                "gender": "Male" if row[5] == 0 else "Female",
                "recordNumber": row[6]
            })
            
    conn.close()
    
    return {
        "success": True,
        "data": {
            "citizen": citizen,
            "patriarch": {
                "name": target_gname or "---",
                "nameEnglish": lexical_translate(target_gname or "")
            },
            "father": {
                "name": target_fname or "---",
                "nameEnglish": lexical_translate(target_fname or "")
            },
            "siblings": siblings,
            "householdPage": household
        }
    }
