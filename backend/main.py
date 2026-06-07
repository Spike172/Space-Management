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
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(status_code=200)

# =====================================================
# DATA STORE
# =====================================================

space_inventory = []

# =====================================================
# HELPERS
# =====================================================

def clean_value(value, default=""):
    if pd.isna(value):
        return default

    value = str(value).strip()

    if value.lower() == "nan":
        return default

    return value


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

        joined = " ".join(values)

        if "sq ft" in joined:
            return idx

    return 0


def normalize_columns(df):
    df.columns = [
        str(c).strip().lower()
        for c in df.columns
    ]

    return df


# =====================================================
# SUMMARY BUILDERS
# =====================================================

def department_summary():

    if not space_inventory:
        return []

    df = pd.DataFrame(space_inventory)

    df = df[
        (df["department"] != "")
        & (df["department"] != "Unassigned")
    ]

    grouped = (
        df.groupby("department")["area"]
        .sum()
        .reset_index()
        .sort_values("area", ascending=False)
    )

    grouped.rename(
        columns={
            "department": "name",
            "area": "value"
        },
        inplace=True
    )

    return grouped.to_dict(orient="records")


def building_summary():

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


def floor_summary():

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


def shared_summary():

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


def top_rooms(limit=10):

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
        .head(limit)
        .to_dict(orient="records")
    )

# =====================================================
# UPLOAD
# =====================================================

@app.post("/upload")
async def upload_excel(
    file: UploadFile = File(...)
):

    global space_inventory

    try:

        contents = await file.read()

        workbook = pd.ExcelFile(
            BytesIO(contents)
        )

        rooms = []

        for sheet_name in workbook.sheet_names:

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

                df = normalize_columns(df)

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

                    department = clean_value(
                        row.get("department")
                    )

                    room_name = clean_value(
                        row.get("room name")
                    )

                    dept_location = clean_value(
                        row.get("dept location")
                    )

                    # eliminate giant "nan" bucket
                    if not department:
                        department = dept_location

                    if not department:
                        department = "Unassigned"

                    floor_value = row.get("level #")

                    if pd.notna(floor_value):
                        try:
                            floor_num = float(floor_value)

                            if floor_num.is_integer():
                                floor_value = int(floor_num)
                            else:
                                floor_value = floor_num

                        except Exception:
                            floor_value = clean_value(
                                floor_value,
                                "Unknown"
                            )
                    else:
                        floor_value = "Unknown"

                    room_number = clean_value(row.get("room # on plan set"))
                    room_name = clean_value(row.get("room name"))
                    building = clean_value(row.get("building"))

                    # Skip summary/total rows

                    if (
                        room_number == ""
                        and room_name == ""
                    ):
                        continue

                    room = {
                        "building": clean_value(
                            row.get("building"),
                            "Unknown"
                        ),

                        "floor": floor_value,

                        "dept_location": dept_location,

                        "room_name": room_name,

                        "room_number": clean_value(
                            row.get(
                                "room # on plan set"
                            )
                        ),

                        "door_number": clean_value(
                            row.get(
                                "room # on door/door frame"
                            )
                        ),

                        "occupant": clean_value(
                            row.get(
                                "name of office occupant on placard"
                            )
                        ),

                        "department": department,

                        "department_head": clean_value(
                            row.get("department head")
                        ),

                        "cost_center": clean_value(
                            row.get("cost center")
                        ),

                        "shared": clean_value(
                            row.get("shared"),
                            "N"
                        ),

                        "area": float(
                            row.get("sq ft", 0)
                        )
                    }

                    rooms.append(room)

            except Exception as sheet_error:
                print(
                    f"Sheet {sheet_name} skipped:"
                    f" {sheet_error}"
                )

        space_inventory = rooms

        return {
            "message": "File processed successfully",
            "rooms_loaded": len(space_inventory)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# ROUTES
# =====================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "rooms_loaded": len(space_inventory)
    }


@app.get("/spaces")
def spaces():
    return space_inventory


@app.get("/spaces/summary")
def summary():
    return department_summary()


@app.get("/spaces/buildings")
def buildings():
    return building_summary()


@app.get("/spaces/floors")
def floors():
    return floor_summary()


@app.get("/spaces/shared")
def shared():
    return shared_summary()


@app.get("/spaces/toprooms")
def largest_rooms():
    return top_rooms()


@app.get("/dashboard")
def dashboard():

    if not space_inventory:

        return {
            "total_area": 0,
            "total_rooms": 0,
            "total_departments": 0,
            "total_buildings": 0,
            "top_departments": [],
            "buildings": [],
            "floors": [],
            "top_rooms": []
        }

    df = pd.DataFrame(space_inventory)

    total_area = float(
        df["area"].sum()
    )

    total_rooms = len(df)

    total_departments = (
        df["department"]
        .nunique()
    )

    total_buildings = (
        df["building"]
        .nunique()
    )

    return {
        "area": total_area,
        "total_area": total_area,

        "total_rooms": total_rooms,

        "total_departments": int(
            total_departments
        ),

        "total_buildings": int(
            total_buildings
        ),

        "top_departments":
            department_summary()[:10],

        "buildings":
            building_summary(),

        "floors":
            floor_summary(),

        "top_rooms":
            top_rooms(10)
    }