# 📊 Enterprise Civil Registry Data Analytics & Exploration Platform

An enterprise-grade, high-throughput analytical platform engineered to ingest, index, and explore **31,164,973 civil registration records** (26.6 GB SQLite database) with **instant sub-second response times**, universal multi-column search, verified family tree lineage reconstruction, cross-filtering, statistical relationship intelligence, and multi-format streaming export (PDF, Excel, CSV, JSON).

---

## 🚀 Quick Deployment & Portability Guide (Sharing as a Zip)

When you zip and share this folder with another person or transfer it to another computer, **it runs out-of-the-box with zero manual setup**.

### 1. The Quick Launch Command

Open a terminal in the unzipped folder and run:

```bash
./start.sh
# or
./run.sh
```

*(On Windows: simply double-click `start.bat` or `run.bat`. On any OS with Python, you can also run `python3 run.py`)*

---

### 2. Purpose of `./start.sh` & `./run.sh` (What Happens Automatically)

The purpose of `./start.sh` and `./run.sh` is to provide a **100% automated, self-healing, zero-friction launch experience** so that neither you nor the recipient ever needs to manually install packages, configure IP addresses, or set environment variables:

1. **Zero-Configuration Environment Setup**:
   - Detects the unzipped folder location automatically without any hardcoded system paths.
   - Automatically creates `.env` from template with portable relative paths (`DATABASE_FILE=./database/data.db`).
2. **Automated Dependency Detection & Repair**:
   - Checks if required Python backend packages (`fastapi`, `uvicorn`, `pydantic`, `reportlab`, `openpyxl`, `arabic_reshaper`, `python-bidi`) are available.
   - If missing, automatically creates an isolated Python virtual environment (`.venv`) and installs packages from `requirements.txt`.
   - If a relocated/broken `.venv` is detected from the sender's computer, it automatically refreshes it cleanly without crashing.
3. **Automated Dual-Binding (Localhost + Network IP Fixed Permanently)**:
   - **Both Localhost AND Local Network IP work automatically on every machine!**
   - Services are permanently configured to bind to `0.0.0.0` (all network interfaces).
   - On startup, the script automatically detects the host machine's active local IP address (e.g., `192.168.x.x`) and displays both access URLs immediately:
     - 📊 **Localhost Dashboard**: `http://localhost:5173` (for local browsing on the host machine)
     - 🌐 **Network Access**: `http://<YOUR_LOCAL_IP>:5173` (accessible instantly by any phone, tablet, laptop, or PC connected to the same Wi-Fi / LAN network)
   - Wildcard CORS (`*`) and Vite reverse-proxying are permanently enabled, meaning external devices only need to connect to port 5173—all API calls are handled seamlessly with zero manual network configuration.
4. **Smart Frontend Fallback (Runs Even Without Node.js)**:
   - If Node.js & npm are installed, it verifies dependencies, builds assets if needed, and launches Vite with instant hot-reloading.
   - If Node.js is NOT installed on the recipient's machine, FastAPI automatically detects the pre-compiled `frontend/dist` assets and serves the complete Cyber-HUD dashboard on port 8001 directly.
5. **Port Conflict Protection**:
   - Automatically frees ports 8001 and 5173 before launching to avoid *"Address already in use"* errors.
6. **Automatic Browser Launch**:
   - Automatically detects the desktop environment (`xdg-open`, `sensible-browser`, `open`) and opens the dashboard in the default browser upon initialization.
7. **Clean Lifecycle & Graceful Shutdown**:
   - Traps exit signals (`Ctrl+C`); when stopped, cleanly shuts down both backend and frontend background workers.

---

### 🌐 Permanent Localhost & Network IP Access (No Manual Setup Needed)

You do **NOT** need to configure network IP addresses or edit code when sharing:

| Connection Type | URL | Intended Users |
| :--- | :--- | :--- |
| **Localhost** | `http://localhost:5173` | The person sitting at the host computer |
| **Local Network (Wi-Fi / LAN)** | `http://<HOST_IP>:5173` | Any colleague, phone, laptop, or office workstation on the same Wi-Fi/LAN |
| **API Documentation** | `http://localhost:8001/docs` | Interactive Swagger API explorer & schema viewer |
| **API Health Status** | `http://localhost:8001/api/health` | Live diagnostic probe verifying database connectivity |

> **Note**: Even if the machine moves to a different Wi-Fi network or receives a new IP address from DHCP, `./start.sh` dynamically detects the new IP and displays it automatically every time it starts.

---

### 📦 Recommended: Creating a Clean Zip for Sharing

To create a clean, optimized zip file for sharing that excludes unnecessary logs and the 25 GB pre-migration backup (`database/data.db.backup`):
```bash
./package_project.sh
```
This script will produce `Data_Dashboard_ReadyToShare.zip` in your parent directory, saving **~25 GB** of upload/download transfer size while keeping all **31,164,973 records** and **51,834 volumes** 100% intact!

---

### 3. Where the Data is Located Inside This Folder

The entire dataset is self-contained directly inside `Data_Dashboard`:

1. **The Full Database**:
   - **Path**: `database/data.db`
   - **Size**: **~26.6 GB**
   - **Content**: All **31,164,973 citizen records**, all **51,834 official archival volumes**, **400 official districts**, and pre-computed analytical caches.
   - **Standalone File**: It is a regular standalone SQLite database with no dependencies on outside paths.
2. **The Volume Pattern Caches**:
   - **Path**: `frontend/public/data/patterns/*.json`
   - **Content**: High-speed search catalogs for all 51,834 books across the 6 official archival categories.
3. **Configuration**:
   - `.env` uses relative paths (`DATABASE_FILE=./database/data.db`), meaning it automatically detects the database regardless of the folder path.

---

### 💻 Hardware & System Recommendations

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 20.04+, Debian 11+, macOS 12+, Windows 10/11 | Ubuntu 22.04 LTS or newer |
| **RAM** | 4 GB | 8 GB - 16 GB (for in-memory cache speed) |
| **Storage** | 35 GB free disk space | Fast NVMe SSD / SATA SSD |
| **Python** | Python 3.10+ | Python 3.10, 3.11, or 3.12 |
| **Node.js** | Node.js v18.x LTS | Node.js v20.x or v22.x LTS |

---

## 🏛️ Official Archival Volume Registry (131,061 Volumes)

Every single one of the **31,164,973 citizen records** is indexed into **131,061 bound archival volumes** categorized into 6 official civil registry types:

| Registry Category | Icon | Books Count | Records Count | Administrative Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **همه کتاب‌ها (All Volumes)** | 🌐 | **131,061** | **31,164,973** | Universal root view covering 100% of all digitized national registers |
| **قلم‌انداز (Qalam Andaz)** | 📝 | **4,657** | **425,495** | Primary on-site field census & initial Tazkira distribution drafts |
| **اساس (Asas / اصل اساس)** | 🏛️ | **1,667** | **150,509** | Foundational master baseline civil registers (Sijil) |
| **متفرقه (Motafariqa)** | 📑 | **1,080** | **576,132** | Supplemental, delayed registrants, annexes & duplicate Tazkira records |
| **تولدات (Births)** | 👶 | **18** | **1,480** | Dedicated hospital vital birth registries for newborn infants |
| **کوچی (Kochi)** | 🏕️ | **303** | **148,216** | Dedicated civil registers for nomadic & pastoralist tribes |
| **سایر دفاتر (Other Official)** | 📚 | **123,336** | **29,863,141** | Digitized official indexed ledgers across all administrative directorates |

$$\sum \text{Volumes} = 4,657 + 1,667 + 1,080 + 18 + 303 + 123,336 = \mathbf{131,061}$$
$$\sum \text{Records} = 425,495 + 150,509 + 576,132 + 1,480 + 148,216 + 29,863,141 = \mathbf{31,164,973}$$

---

## 🗺️ Administrative Divisions & Districts (400 Districts)

The platform incorporates the complete official Afghanistan NSIA administrative hierarchy across **34 provinces + Kochi nomadic registry** (35 administrative units) covering **400 official districts**:

- **Dynamic Navbar Cascading**:
  - When no province is selected, displays **`All Districts (400)`** with province qualifiers (e.g. `Paghman • پغمان [Kabul]`).
  - When a province is selected (e.g. Kabul, Herat, Balkh), it immediately cascades to that province's authentic districts:
    - **کابل (Kabul)**: 15 districts (مرکز کابل, پغمان, بگرامی, ده سبز, etc.)
    - **هرات (Herat)**: 16 districts (مرکز هرات, انجیل, گذره, شیندند, etc.)
    - **کندهار (Kandahar)**: 18 districts (مرکز کندهار, ارغنداب, دند, سپین بولدک, etc.)
    - **بلخ (Balkh)**: 14 districts (مرکز مزار شریف, بلخ, دهدادی, نهر شاهی, etc.)
    - **کوچی (Kochi)**: 4 nomadic regional sectors
- **Automatic Binding**: Selecting any district automatically binds and selects its parent province.

---

## ⚡ Enterprise Cyber-HUD Capabilities

The platform integrates the **Reference Cyber-HUD Architecture**, seamlessly unifying:

1. **Dual-Stream Translation Studio (`/api/translate`):**
   - Side-by-side translation between RTL native Afghan scripts (Dari `prs_Arab` / Pashto `pus_Arab`) and English `eng_Latn`.
   - Instant lexical translation dictionary + lazy-loaded Meta NLLB-200 3.3B neural model fallback.
2. **128D Biometric Face Studio with Vector Arrow HUD (`/api/biometrics/*`):**
   - 128-dimensional Euclidean vector matching against biometric embeddings.
   - Interactive Vector Arrow HUD with 8 multi-directional vector arrows, Delaunay facial triangulation mesh, and 1-to-N candidate rankings.
3. **34-Province Geocartography GIS Matrix (`/api/analytics/provinces`):**
   - High-resolution cartography map showcase with province dossier cards, live ECharts Treemaps, and province-by-gender distribution analytics.
4. **Humanitarian RTP Relief Registry (`/api/rtp/records`):**
   - 626K emergency relief survey database across all 23 schema columns (PID, rations, bread loaves, vulnerability, nahya, gozar).
5. **IVP Security & Operator Credential Audit (`/api/ivp/audit`):**
   - 1,112 portal operator accounts across 48 regional offices with PBKDF2 hash inspection and role privilege controls.
6. **Cross-Domain Statistical Radar (`/api/stats/radar`):**
   - Multi-domain analytical telemetry unifying NSIA civil registries, RTP beneficiaries, and IVP operator accounts.

---

## 📂 Repository Folder Structure

```text
Data_Dashboard/
├── .env                             # Active environment configuration (relative paths, ports, hosts)
├── .env.example                     # Environment configuration template
├── requirements.txt                 # Python backend package dependencies
├── setup.sh                         # Automated one-click setup script for Linux & macOS
├── start.sh                         # Interactive dual-server startup script for Linux & macOS
├── start_background.sh              # 24/7 background supervisor launcher (survives terminal exit)
├── stop.sh                          # Process termination utility for all background instances
├── supervisor.sh                    # High-availability watchdog daemon (auto-restarts failed services)
├── setup.bat                        # Automated setup script for Windows
├── start.bat                        # Automated launcher for Windows
├── README.md                        # Complete project documentation & setup manual
│
├── database/                        # Database storage directory
│   └── data.db                      # Primary standalone SQLite database (26.6 GB, 31.2M records)
│
├── backend/                         # FastAPI Python REST API Backend
│   ├── database.py                  # Database connection pool, PRAGMA tuning, path resolver
│   ├── main.py                      # REST endpoints, search router, lineage engine, export center
│   ├── routers/                     # Specialized sub-routers (translation, biometrics, IVP, RTP)
│   └── services/                    # Machine learning, translation, and biometric service workers
│
├── analytics/                       # Analytical & Statistical Processing Core
│   └── engine.py                    # Pure-Python statistical engine (Pearson, Spearman, Cramér's V)
│
├── scripts/                         # Maintenance & Data Pipeline Scripts
│   ├── populate_districts.py        # 400 official Afghanistan districts generator
│   └── generate_pattern_books.py    # Static pattern cache builder for 131,061 books
│
└── frontend/                        # React + TypeScript + Vite Web Dashboard
    ├── index.html                   # HTML entry point with Persian/Dari web font support
    ├── package.json                 # Frontend dependencies (React, Lucide, ECharts, Tailwind)
    ├── vite.config.ts               # Vite build config with backend API reverse proxy
    ├── public/
    │   └── data/patterns/           # Static JSON catalogs for all 131,061 volumes
    └── src/
        ├── context/FilterContext.tsx# Synchronized global filter state
        ├── utils/bookPattern.ts     # 6 official volume pattern classifiers & definitions
        ├── utils/geoTranslation.ts  # Dual English & Dari/Persian geo dictionaries
        └── components/
            ├── layout/              # Header, Sidebar, GlobalFilterBar
            ├── views/               # ExecutiveOverview, AdvancedSearch, DataExplorer, BookPageExplorer
            └── common/              # RecordDrawer, ExportModal, AfghanVirtualKeyboard
```

---

## 📋 16 Core Civil Registry Attributes Schema

Every citizen identity record contains 16 verified civil attributes:

| # | Column Name | SQLite Type | Description | Example |
|---|---|---|---|---|
| 1 | `id` | `INTEGER PRIMARY KEY` | Unique registry entry ID | `1009` |
| 2 | `integer_key` | `INTEGER` | System sequence key | `634067377` |
| 3 | `hash_key` | `TEXT (32)` | MD5 identity fingerprint | `B3BDB5290D8773A703554E96DA34E64F` |
| 4 | `name` | `TEXT (UTF-8)` | Citizen Personal Name (نام) | `ظریفه` |
| 5 | `fname` | `TEXT (UTF-8)` | Father's Name (نام پدر) | `لالا شیرین` |
| 6 | `gname` | `TEXT (UTF-8)` | Grandfather's Name (نام پدرکلان) | `در محمد` |
| 7 | `dob_year` | `INTEGER` | Birth Year (Solar Hijri هجری شمسی) | `1388` (~2009 CE) |
| 8 | `gender` | `INTEGER` | Demographic Code (`0` = Male, `1` = Female) | `1` |
| 9 | `province` | `TEXT (UTF-8)` | Province Name (ولایت) | `کابل` |
| 10 | `district` | `TEXT (UTF-8)` | District Name (ولسوالی) | `موسهی` |
| 11 | `province_code`| `TEXT (3)` | Standard Province Code | `KBL` |
| 12 | `district_code`| `TEXT (4)` | Administrative District Code | `0107` |
| 13 | `record_number`| `INTEGER` | Ledger Entry Ordinal Number | `201` |
| 14 | `page_number` | `INTEGER` | Physical Volume Page Number | `41` |
| 15 | `book_name` | `TEXT (UTF-8)` | Official Bound Volume Title | `جلد 4 قلم انداز سال 1396 ولسوالی موسهی ولایت کابل` |
| 16 | `cropped_path` | `TEXT` | Historical Scanned Image Path | `\15\48\59864\41\1009.jpg` |

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, database connection, and total record count (**31,164,973**) |
| `GET` | `/api/filters/options` | Dynamic filter options: provinces, 400 districts, books, and Solar Hijri years |
| `GET` | `/api/analytics/kpis` | Real-time KPIs: records, unique books, districts, provinces, gender ratios |
| `GET` | `/api/records` | Server-paginated, sorted, and multi-field prefix search over records |
| `GET` | `/api/records/{id}` | Single citizen record inspection (16 verified fields) |
| `GET` | `/api/records/{id}/family-tree` | Verified 4-tier patrilineal family tree reconstruction |
| `GET` | `/api/books/ledger-page` | Live citizen records on a specific physical ledger page |
| `GET` | `/api/records/export` | Universal streaming export: CSV (UTF-8 BOM), Excel (.xlsx), PDF, JSON |
| `GET` | `/api/reports/executive-summary-pdf` | Executive C-level summary report formatted in PDF |

---

## 🛠️ Management & Troubleshooting Commands

### Stop All Services
```bash
./stop.sh
```

### Check Logs Live
```bash
# Supervisor watchdog log:
tail -f supervisor.log

# Backend FastAPI log:
tail -f backend.log

# Frontend Vite log:
tail -f frontend.log
```

### Free Ports Manually (If in Use)
```bash
fuser -k 8001/tcp
fuser -k 5173/tcp
```
# newafg
