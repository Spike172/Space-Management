from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
import pandas as pd
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://spike172.github.io",
        "https://space-management-api.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Explicit OPTIONS handler to prevent 405 on preflight requests
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(status_code=200)


def find_header_row(df_raw):
    """Scan rows to find the one that looks like a real header (most non-null values)."""
    best_row = 0
    best_count = 0
    for i, row in df_raw.iterrows():
        non_null = row.notna().sum()
        if non_null > best_count:
            best_count = non_null
            best_row = i
    return best_row


@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        # Read raw first without assuming headers
        df_raw = pd.read_excel(BytesIO(contents), engine="openpyxl", header=None)
        df_raw = df_raw.dropna(how="all")

        # Find the real header row
        header_row_idx = find_header_row(df_raw)

        # Re-read using that row as the header
        df = pd.read_excel(
            BytesIO(contents),
            engine="openpyxl",
            header=header_row_idx,
        )
        df = df.dropna(how="all")
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Drop unnamed columns from messy top rows
        df = df.loc[:, ~df.columns.str.startswith("unnamed")]

        # Detect area column
        area_cols = [c for c in df.columns if any(k in c for k in [
            "area", "sq ft", "sqft", "square", "size", "gsf", "nsf"
        ])]

        # Detect usage/grouping column
        usage_cols = [c for c in df.columns if any(k in c for k in [
            "use", "type", "class", "room name", "dept", "department", "space"
        ])]

        if not area_cols or not usage_cols:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Could not detect required columns",
                    "columns_found": df.columns.tolist(),
                    "tip": "Need a column with area/sq ft and a column with room name/department/use type"
                }
            )

        area_col = area_cols[0]
        usage_col = usage_cols[0]

        df[area_col] = pd.to_numeric(df[area_col], errors="coerce")
        df = df.dropna(subset=[area_col, usage_col])
        df = df[df[area_col] > 0]  # drop zero/negative areas

        grouped = df.groupby(usage_col)[area_col].sum().reset_index()
        grouped.rename(columns={usage_col: "name", area_col: "value"}, inplace=True)
        grouped = grouped.sort_values("value", ascending=False)

        summary = grouped.to_dict(orient="records")

        return {
            "message": "File processed successfully",
            "summary": summary,
            "area_column": area_col,
            "usage_column": usage_col,
            "row_count": len(df),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))