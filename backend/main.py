from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
import pandas as pd
from io import BytesIO

app = FastAPI(title="Space Management API")

# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(status_code=200)

# =====================================================
# In-Memory Storage
# =====================================================

space_inventory = []

# =====================================================
# Utilities
# =====================================================

def find_header_row(df_raw):
    """
    Find row containing SQ FT header.
    """

    for idx, row in df_raw.iterrows():

        values = [
            str(v).strip().lower()
            for v in row.values
            if pd.notna(v)
        ]

        if "sq ft" in values:
            return idx

    return 0


def normalize_column_name(col):
    return str(col).strip().lower()


# =====================================================
# Upload Endpoint
# =====================================================

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):

    global space_inventory

    try:

        contents = await file.read()

        workbook = pd.ExcelFile(BytesIO(contents))

        all_rooms = []

        for sheet_name in workbook.sheet_names:

            # Skip obvious template sheets
            if "template" in sheet_name.lower():
                continue

            try:

                raw_df = pd.read_excel(
                    BytesIO(contents),
                    sheet_name=sheet_name,
                    header=None
                )

                raw_df = raw_df.dropna(how="all")

                header_row = find_header_row(raw_df)

                df = pd.read_excel(
                    BytesIO(contents),
                    sheet_name=sheet_name,
                    header=header_row
                )

                df.columns = [
                    normalize_column_name(c)
                    for c in df.columns
                ]

                df = df.loc[
                    :,
                    ~df.columns.str.startswith("unnamed")
                ]

                df = df.dropna(how="all")

                if "sq ft" not in df.columns:
                    continue

                df["sq ft"] = pd.to_numeric(
                    df["sq ft"],
                    errors="coerce"
                )

                df = df.dropna(subset=["sq ft"])

                for _, row in df.iterrows():

                    room = {
                        "building": str(
                            row.get("building", "")
                        ).strip(),

                        "floor": str(
                            row.get("level #", "")
                        ).strip(),

                        "dept_location": str(
                            row.get("dept location", "")
                        ).strip(),

                        "room_name": str(
                            row.get("room name", "")
                        ).strip(),

                        "room_number": str(
                            row.get(
                                "room # on plan set",
                                ""
                            )
                        ).strip(),

                        "door_number": str(
                            row.get(
                                "room # on door/door frame",
                                ""
                            )
                        ).strip(),

                        "occupant": str(
                            row.get(
                                "name of office occupant on placard",
                                ""
                            )
                        ).strip(),

                        "department": str(
                            row.get(
                                "department",
                                "Unassigned"
                            )
                        ).strip(),

                        "department_head": str(
                            row.get(
                                "department head",
                                ""
                            )
                        ).strip(),

                        "cost_center": str(
                            row.get(
                                "cost center",
                                ""
                            )
                        ).strip(),

                        "shared": str(
                            row.get(
                                "shared",
                                "N"
                            )
                        ).strip(),

                        "area": float(
                            row.get("sq ft", 0)
                        ),
                    }

                    all_rooms.append(room)

            except Exception as sheet_error:
                print(
                    f"Skipping sheet {sheet_name}: "
                    f"{sheet_error}"
                )

        space_inventory = all_rooms

        return {
            "message": "File processed successfully",
            "rooms_loaded": len(space_inventory),
            "summary": build_department_summary()
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# Summary Helpers
# =====================================================

def build_department_summary():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    grouped = (
        df.groupby("department")["area"]
        .sum()
        .reset_index()
    )

    grouped.rename(
        columns={
            "department": "name",
            "area": "value"
        },
        inplace=True
    )

    grouped = grouped.sort_values(
        "value",
        ascending=False
    )

    return grouped.to_dict(orient="records")


def build_building_summary():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    grouped = (
        df.groupby("building")["area"]
        .sum()
        .reset_index()
    )

    grouped.rename(
        columns={
            "building": "name",
            "area": "value"
        },
        inplace=True
    )

    return grouped.to_dict(orient="records")


def build_floor_summary():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    grouped = (
        df.groupby("floor")["area"]
        .sum()
        .reset_index()
    )

    grouped.rename(
        columns={
            "floor": "name",
            "area": "value"
        },
        inplace=True
    )

    return grouped.to_dict(orient="records")


def build_shared_summary():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    grouped = (
        df.groupby("shared")["area"]
        .sum()
        .reset_index()
    )

    grouped.rename(
        columns={
            "shared": "name",
            "area": "value"
        },
        inplace=True
    )

    return grouped.to_dict(orient="records")


def build_top_rooms():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    df = df.sort_values(
        "area",
        ascending=False
    )

    return (
        df[
            [
                "room_name",
                "department",
                "building",
                "floor",
                "area"
            ]
        ]
        .head(25)
        .to_dict(orient="records")
    )

# =====================================================
# API Endpoints
# =====================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "rooms_loaded": len(space_inventory)
    }


@app.get("/spaces")
def get_spaces():
    return space_inventory


@app.get("/spaces/summary")
def get_department_summary():

    summary = build_department_summary()

    if not summary:
        return [
            {
                "name": "No data yet",
                "value": 0
            }
        ]

    return summary


@app.get("/spaces/buildings")
def get_buildings():
    return build_building_summary()


@app.get("/spaces/floors")
def get_floors():
    return build_floor_summary()


@app.get("/spaces/shared")
def get_shared():
    return build_shared_summary()


@app.get("/spaces/toprooms")
def get_top_rooms():
    return build_top_rooms()