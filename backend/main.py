from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://spike172.github.io", # frontend root access
        "https://spike172.github.io/Space-Management", # Frontend access
        "https://space-management-api.onrender.com",
        "http://localhost:5173",       # For local testing
        "http://localhost:3000",
    ],
    allow_origin_regex=".*",   # ⭐ FIXES Render CORS EDGE CASES
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],       # ⭐ needed for some browsers
)

data_summary = []

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))

    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]

    # Try to detect area column
    area_col = next(
        c for c in df.columns if "area" in c
    )

    # Try to detect usage / classification column
    usage_col = next(
        c for c in df.columns if "use" in c or "type" in c or "class" in c
    )

    grouped = (
        df.groupby(usage_col)[area_col]
        .sum()
        .reset_index()
    )

    grouped.rename(
        columns={
            usage_col: "name",
            area_col: "value"
        },
        inplace=True
    )

    global data_summary
    data_summary = grouped.to_dict(orient="records")

    return {
        "message": "File processed successfully",
        "summary": data_summary
    }
