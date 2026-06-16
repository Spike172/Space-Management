from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from database import init_db, User, Space, get_db
from pydantic import BaseModel

import pandas as pd
from io import BytesIO

from sqlalchemy.orm import Session

from auth import (hash_password, verify_password, create_access_token, get_current_user)

app = FastAPI(title="Space Management API")

init_db()

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
# REQUEST MODELS
# =====================================================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

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
    """Find row containing SQ FT header."""
    for idx, row in df_raw.iterrows():
        values = [str(v).strip().lower() for v in row.values if pd.notna(v)]
        joined = " ".join(values)
        if "sq ft" in joined:
            return idx
    return 0

def normalize_columns(df):
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df

def get_user_spaces_df(user_id: str, db: Session) -> pd.DataFrame:
    """Helper to fetch a user's spaces from the DB and convert to a Pandas DataFrame."""
    spaces = db.query(Space).filter(Space.user_id == user_id).all()
    if not spaces:
        return pd.DataFrame()
    
    # Convert SQLAlchemy objects to dicts, ignoring internal state
    data = [{column.name: getattr(s, column.name) for column in s.__table__.columns} for s in spaces]
    return pd.DataFrame(data)

# =====================================================
# SUMMARY BUILDERS
# =====================================================

def department_summary(user_id: str, db: Session):
    df = get_user_spaces_df(user_id, db)
    if df.empty:
        return []

    df = df[(df["department"] != "") & (df["department"] != "Unassigned")]
    grouped = (
        df.groupby("department")["area"]
        .sum()
        .reset_index()
        .sort_values("area", ascending=False)
    )
    grouped.rename(columns={"department": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def building_summary(user_id: str, db: Session):
    df = get_user_spaces_df(user_id, db)
    if df.empty:
        return []

    grouped = df.groupby("building")["area"].sum().reset_index()
    grouped.rename(columns={"building": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def floor_summary(user_id: str, db: Session):
    df = get_user_spaces_df(user_id, db)
    if df.empty:
        return []

    grouped = df.groupby("floor")["area"].sum().reset_index()
    grouped.rename(columns={"floor": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def shared_summary(user_id: str, db: Session):
    df = get_user_spaces_df(user_id, db)
    if df.empty:
        return []

    grouped = df.groupby("shared")["area"].sum().reset_index()
    grouped.rename(columns={"shared": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def top_rooms(user_id: str, db: Session, limit=10):
    df = get_user_spaces_df(user_id, db)
    if df.empty:
        return []

    df = df.sort_values("area", ascending=False)
    return (
        df[["room_name", "department", "building", "floor", "area"]]
        .head(limit)
        .to_dict(orient="records")
    )

# =====================================================
# UPLOAD
# =====================================================

@app.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        workbook = pd.ExcelFile(BytesIO(contents))
        
        rooms_to_insert = []
        user_id = current_user["sub"]

        # Clear existing data for this user to prevent duplicates on re-upload
        db.query(Space).filter(Space.user_id == user_id).delete()

        for sheet_name in workbook.sheet_names:
            if "template" in sheet_name.lower():
                continue

            try:
                raw_df = pd.read_excel(BytesIO(contents), sheet_name=sheet_name, header=None)
                raw_df = raw_df.dropna(how="all")
                header_row = find_header_row(raw_df)

                df = pd.read_excel(BytesIO(contents), sheet_name=sheet_name, header=header_row)
                df = normalize_columns(df)
                df = df.loc[:, ~df.columns.str.startswith("unnamed")]
                df = df.dropna(how="all")

                if "sq ft" not in df.columns:
                    continue

                df["sq ft"] = pd.to_numeric(df["sq ft"], errors="coerce")
                df = df.dropna(subset=["sq ft"])

                for _, row in df.iterrows():
                    department = clean_value(row.get("department"))
                    dept_location = clean_value(row.get("dept location"))

                    if not department:
                        department = dept_location
                    if not department:
                        department = "Unassigned"

                    floor_value = row.get("level #")
                    if pd.notna(floor_value):
                        try:
                            floor_num = float(floor_value)
                            floor_value = int(floor_num) if floor_num.is_integer() else floor_num
                        except Exception:
                            floor_value = clean_value(floor_value, "Unknown")
                    else:
                        floor_value = "Unknown"

                    room_number = clean_value(row.get("room # on plan set"))
                    room_name = clean_value(row.get("room name"))
                    
                    if room_number == "" and room_name == "":
                        continue

                    # Create DB model instance
                    new_space = Space(
                        user_id=user_id,
                        building=clean_value(row.get("building"), "Unknown"),
                        floor=str(floor_value),
                        dept_location=dept_location,
                        room_name=room_name,
                        room_number=room_number,
                        door_number=clean_value(row.get("room # on door/door frame")),
                        occupant=clean_value(row.get("name of office occupant on placard")),
                        department=department,
                        department_head=clean_value(row.get("department head")),
                        cost_center=clean_value(row.get("cost center")),
                        shared=clean_value(row.get("shared"), "N"),
                        area=float(row.get("sq ft", 0))
                    )
                    rooms_to_insert.append(new_space)

            except Exception as sheet_error:
                print(f"Sheet {sheet_name} skipped: {sheet_error}")

        # Bulk insert to database
        db.bulk_save_objects(rooms_to_insert)
        db.commit()

        return {
            "message": "File processed successfully",
            "rooms_loaded": len(rooms_to_insert)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# ROUTES
# =====================================================

@app.get("/")
def root():
    return {"status": "online"}

@app.get("/spaces")
def spaces(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Space).filter(Space.user_id == current_user["sub"]).all()

@app.get("/spaces/summary")
def summary(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return department_summary(current_user["sub"], db)

@app.get("/spaces/buildings")
def buildings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return building_summary(current_user["sub"], db)

@app.get("/spaces/floors")
def floors(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return floor_summary(current_user["sub"], db)

@app.get("/spaces/shared")
def shared(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return shared_summary(current_user["sub"], db)

@app.get("/spaces/toprooms")
def largest_rooms(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return top_rooms(current_user["sub"], db)

# =====================================================
# AUTHENTICATION
# =====================================================

@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=request.username,
        email=request.email,
        password_hash=hash_password(request.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User created", "user_id": user.id}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(
        {
            "sub": str(user.id),
            "username": user.username,
        }
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user

# =====================================================
# DASHBOARD
# =====================================================

@app.get("/dashboard")
def dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["sub"]
    df = get_user_spaces_df(user_id, db)

    if df.empty:
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

    total_area = float(df["area"].sum())
    total_rooms = len(df)
    total_departments = df["department"].nunique()
    total_buildings = df["building"].nunique()

    return {
        "area": total_area,
        "total_area": total_area,
        "total_rooms": total_rooms,
        "total_departments": int(total_departments),
        "total_buildings": int(total_buildings),
        "top_departments": department_summary(user_id, db)[:10],
        "buildings": building_summary(user_id, db),
        "floors": floor_summary(user_id, db),
        "top_rooms": top_rooms(user_id, db, 10)
    }