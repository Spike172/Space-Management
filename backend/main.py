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
        "https://space-management-api.onrender.com",
        "http://localhost:5173",       # For local testing
        "http://localhost:3000",
    ],
    allow_credentials=False,  # 🔥 MUST be False
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],       # ⭐ needed for some browsers
)

data_summary = []

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()

    df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    df = df.dropna(how="all")
    df.columns = [c.strip().lower() for c in df.columns]

    area_cols = [c for c in df.columns if "area" in c]
    usage_cols = [c for c in df.columns if "use" in c or "type" in c or "class" in c]

    if not area_cols or not usage_cols:
        return {
            "error": "Could not detect required columns",
            "columns_found": df.columns.tolist()
        }

    area_col = area_cols[0]
    usage_col = usage_cols[0]

    df[area_col] = pd.to_numeric(df[area_col], errors="coerce")
    df = df.dropna(subset=[area_col, usage_col])

    grouped = df.groupby(usage_col)[area_col].sum().reset_index()
    grouped.rename(columns={usage_col: "name", area_col: "value"}, inplace=True)

    global data_summary
    data_summary = grouped.to_dict(orient="records")

    return {"message": "File processed successfully", "summary": data_summary}