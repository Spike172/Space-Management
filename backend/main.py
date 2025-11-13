# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend requests (important!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for testing; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/spaces/summary")
def get_summary():
    return [
        {"name": "Occupied", "value": 65},
        {"name": "Available", "value": 25},
        {"name": "Reserved", "value": 10},
    ]

@app.get("/")
def home():
    return {"message": "Backend running!"}
