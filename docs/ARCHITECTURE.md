# System Architecture & Technical Design

## Architectural Overview

The **Data Analytics & Exploration Platform** is engineered as an enterprise-grade, high-throughput analytical dashboard capable of handling multi-gigabyte datasets with instant sub-second response times.

```
┌──────────────────────────────────────────────────────────────┐
│                    React Frontend Layer                      │
│   • Executive KPIs & Global Filter Bar (Cross-Filtering)     │
│   • Geographic & Demographic Visual Analytics (ECharts)      │
│   • Statistical Relationship & Correlation Lab               │
│   • Enterprise Data Explorer & Record Inspector Drawer       │
│   • Data Quality Center & Outlier Detection                  │
│   • Book / Page Explorer & Universal Fuzzy/Exact Search      │
└──────────────────────────────┬───────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼───────────────────────────────┐
│                    FastAPI Backend Engine                    │
│   • Query Builder & Parameterized SQL Construction           │
│   • Real-Time Statistical Calculations (Pearson, Spearman)   │
│   • Categorical Association (Chi-Square, Cramér's V)         │
│   • Dynamic Smart Insights Generation Engine                 │
│   • Streaming Data Exporter (UTF-8 BOM CSV / JSON)           │
└──────────────────────────────┬───────────────────────────────┘
                               │ SQLite C API (WAL Mode)
┌──────────────────────────────▼───────────────────────────────┐
│                     High-Performance SQLite                  │
│   • `records` (Indexed by Province, District, Gender, DoB)   │
│   • `analytics_cache` (Precomputed statistical aggregations) │
│   • `metadata` (Zero-loss ingestion verification log)        │
│   • `saved_searches` (Persistent custom filter queries)      │
└──────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions
1. **Direct USB Storage Preservation:** No full-size raw data duplication is made to home or temporary disk. SQLite database is maintained on the USB partition.
2. **Indexed Query Engine:** Multi-column B-Tree indexes on geographic, temporal, and registry fields guarantee <10ms lookup speeds.
3. **Precomputed Analytical Cubes:** Core statistical distributions and correlation matrices are precalculated during ingestion for instantaneous dashboard load.
4. **Zero-Loss UTF-16 Stream Ingestion:** Ingestion parses records using memory-bounded chunks with strict row-count verification.
