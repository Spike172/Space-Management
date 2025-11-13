from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL on Render later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_summary = []

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))

    # Expect columns: Room | Area | Usage
    grouped = df.groupby("Usage")["Area"].sum().reset_index()
    grouped.rename(columns={"Area": "value", "Usage": "name"}, inplace=True)

    global data_summary
    data_summary = grouped.to_dict(orient="records")

    return {"message": "File processed", "summary": data_summary}

@app.get("/spaces/summary")
def get_summary():
    return data_summary or [{"name": "No data yet", "value": 0}]
