from app.services.excel import extract_tables


gold_tables = [
    {
        "title": "ICE Currently Detained by Processing Disposition and Detention Facility Type: FY2025",
        "columns": 4,
        "rows": 5,
    },
    {
        "title": "Average Time from USCIS Fear Decision Service Date to ICE Release (In Days)",
        "columns": 4,
        "rows": 1,
    },
    {
        "title": "Aliens with USCIS-Established Fear Decisions in an ICE Detention Facility by Facility Type",
        "columns": 2,
        "rows": 3,
    },
    {
        "title": "ICE Currently Detained by Criminality and Arresting Agency: FY2025",
        "columns": 6,
        "rows": 4,
    },
    {
        "title": "ICE Initial Book-Ins by Arresting Agency and Month: FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "ICE Initial Book-Ins by Facility Type and Criminality: FY2025",
        "columns": 5,
        "rows": 3,
    },
    {"title": "ICE Final Book Outs by Facility Type: FY2025", "columns": 2, "rows": 3},
    {"title": "ICE Removals: FY2025", "columns": 2, "rows": 2},
    {
        "title": "ICE Final Book Outs by Release Reason, Month and Criminality: FY2025",
        "columns": 15,
        "rows": 49,
    },
    {
        "title": "ICE Average Daily Population by Arresting Agency, Month and Criminality: FY2025",
        "columns": 14,
        "rows": 12,
    },
    {
        "title": "ICE Average Length of Stay by Arresting Agency, Month and Criminality: FY2025",
        "columns": 14,
        "rows": 12,
    },
    {
        "title": "ICE Average Daily Population by Facility Type and Month: FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "ICE Average Length of Stay by Facility Type and Month: FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "ICE Average Length of Stay Adult Facility Type by Month and Arresting Agency: FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "ICE Average Length of Stay Adult Facility Type by Month and Arresting Agency: FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "Aliens with Positive Credible Fear Determination Parole Requested: FY2023 - FY2025",
        "columns": 14,
        "rows": 3,
    },
    {
        "title": "Aliens with Positive Credible Fear Determination Parole Status: FY2023 - FY2025",
        "columns": 15,
        "rows": 6,
    },
    {
        "title": "ICE Currently Detained of Stateless Aliens by Detention Facility",
        "columns": 3,
        "rows": 30,
    },
]


# TODO turn this into an actual unit test
def test_excel():
    tables = extract_tables(
        "app/files/data/FY25_detentionStats06202025.xlsx", sheet_name="Detention FY25"
    )

    gold_lookup = {t["title"]: t for t in gold_tables}

    gold_set = set([g["title"] for g in gold_tables])
    found_set = set(tables.keys())

    matching_set = gold_set.intersection(found_set)
    missing_set = gold_set.difference(found_set)
    new_set = found_set.difference(gold_set)
    print(f"{len(matching_set)}/{len(gold_set)} gold titles found")

    for title in sorted(matching_set):
        gold = gold_lookup[title]
        found = tables[title]
        gold_rows = gold["rows"]
        gold_cols = gold["columns"]
        found_rows = len(found)
        found_col_set = set(found[0].keys())
        found_cols = len(found_col_set)
        if gold_rows != found_rows:
            print(
                f"  Rows mismatch: expected {gold_rows} vs actual {found_rows} for {title}"
            )
        if gold_cols != found_cols:
            print(
                f"  Columns mismatch: expected {gold_cols} vs actual {found_cols} ({found_col_set}) for {title}"
            )

    print(f"{len(missing_set)} missing titles:")
    for title in sorted(missing_set):
        print(f"  {title}")

    print(f"{len(new_set)} new titles found not in gold set:")
    for title in sorted(new_set):
        print(f"  {title}")
