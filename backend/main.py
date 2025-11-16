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
    print("UPLOAD RECEIVED:", file.filename)

    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        print("DATAFRAME LOADED:", df.head())
    except Exception as e:
        print("❌ EXCEL PARSE ERROR:", e)
        return {"error": str(e)}

    grouped = df.groupby("Usage")["Area"].sum().reset_index()
    grouped.rename(columns={"Area": "value", "Usage": "name"}, inplace=True)

    global data_summary
    data_summary = grouped.to_dict(orient="records")

    print("SUMMARY SAVED:", data_summary)
    return {"message": "File processed", "summary": data_summary}