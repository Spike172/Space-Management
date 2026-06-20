from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from database import init_db, User, Project, Space, get_db
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
    if pd.isna(value) or value is None:
        return default
    value = str(value).strip()
    if value.lower() == "nan" or value == "":
        return default
    return value

def parse_int(value, default=0):
    if pd.isna(value) or value is None:
        return default
    try:
        # Safely converts floats like 2.0 or strings like " 2 " to integer 2
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return default

def find_header_row(df_raw):
    """Find row containing SQ FT or Area header."""
    for idx, row in df_raw.iterrows():
        values = [str(v).strip().lower() for v in row.values if pd.notna(v)]
        joined = " ".join(values)
        if "sq ft" in joined or "area" in joined:
            return idx
    return 0

def normalize_columns(df):
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df

def get_project_spaces_df(project_id: str, db: Session) -> pd.DataFrame:
    spaces = db.query(Space).filter(Space.project_id == project_id).all()
    if not spaces:
        return pd.DataFrame()
    data = [{column.name: getattr(s, column.name) for column in s.__table__.columns} for s in spaces]
    return pd.DataFrame(data)

# =====================================================
# SUMMARY BUILDERS
# =====================================================

def department_summary(project_id: str, db: Session):
    df = get_project_spaces_df(project_id, db)
    if df.empty: return []
    df = df[(df["department"] != "") & (df["department"] != "Unassigned")]
    grouped = df.groupby("department")["area"].sum().reset_index().sort_values("area", ascending=False)
    grouped.rename(columns={"department": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def building_summary(project_id: str, db: Session):
    df = get_project_spaces_df(project_id, db)
    if df.empty: return []
    grouped = df.groupby("building")["area"].sum().reset_index()
    grouped.rename(columns={"building": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def floor_summary(project_id: str, db: Session):
    df = get_project_spaces_df(project_id, db)
    if df.empty: return []
    grouped = df.groupby("floor")["area"].sum().reset_index()
    grouped.rename(columns={"floor": "name", "area": "value"}, inplace=True)
    return grouped.to_dict(orient="records")

def top_rooms(project_id: str, db: Session, limit=10):
    df = get_project_spaces_df(project_id, db)
    if df.empty: return []
    df = df.sort_values("area", ascending=False)
    return df[["room_name", "department", "building", "floor", "area"]].head(limit).to_dict(orient="records")

# =====================================================
# PROJECTS
# =====================================================

@app.get("/projects")
def get_projects(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["sub"]
    return db.query(Project).filter(Project.user_id == user_id).order_by(Project.uploaded_at.desc()).all()

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

        base_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        project_name = base_name
        counter = 1
        while db.query(Project).filter(Project.user_id == user_id, Project.name == project_name).first() is not None:
            project_name = f"{base_name} ({counter})"
            counter += 1

        new_project = Project(name=project_name, user_id=user_id)
        db.add(new_project)
        db.flush()

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

                # 1. Global cleanup for placeholder marks and empty spaces
                df = df.replace(r'^\?+$', None, regex=True)
                df = df.replace(r'^\s*$', None, regex=True)

                # 2. Dynamically search for core columns (handles variations like 'Bldg' or 'Wing Loc')
                bldg_col = next((c for c in df.columns if c in ['building', 'bldg'] or 'build' in c), None)
                wing_col = next((c for c in df.columns if 'wing' in c), None)
                sqft_col = next((c for c in df.columns if 'sq ft' in c or 'area' in c), None)
                
                ws_col = next((c for c in df.columns if 'workstation' in c and 'empty' not in c and 'vacant' not in c), None)
                empty_ws_col = next((c for c in df.columns if 'workstation' in c and ('empty' in c or 'vacant' in c)), None)

                if not sqft_col:
                    continue

                # 3. Forward fill identified building and wing columns
                if bldg_col: df[bldg_col] = df[bldg_col].ffill()
                if wing_col: df[wing_col] = df[wing_col].ffill()

                df[sqft_col] = pd.to_numeric(df[sqft_col], errors="coerce")
                df = df.dropna(subset=[sqft_col])

                for _, row in df.iterrows():
                    # --- DYNAMIC WING & BUILDING LOGIC ---
                    bldg_val = row.get(bldg_col) if bldg_col else row.get("building")
                    raw_bldg = clean_value(bldg_val)
                    if not raw_bldg: 
                        raw_bldg = sheet_name

                    wing_val = row.get(wing_col) if wing_col else row.get("wing location")
                    wing_loc = clean_value(wing_val)

                    if raw_bldg.upper() == "WING" and wing_loc:
                        final_bldg = f"WING {wing_loc.upper()}"
                    else:
                        final_bldg = raw_bldg

                    # --- REMAINING MAPPING ---
                    department = clean_value(row.get("department"))
                    dept_location = clean_value(row.get("dept location"))
                    department = department or dept_location or "Unassigned"

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

                    new_space = Space(
                        user_id=user_id,
                        project_id=new_project.id,  
                        building=final_bldg, 
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
                        area=float(row.get(sqft_col, 0)),
                        workstations=parse_int(row.get(ws_col) if ws_col else 0),
                        empty_workstations=parse_int(row.get(empty_ws_col) if empty_ws_col else 0)
                    )
                    rooms_to_insert.append(new_space)

            except Exception as sheet_error:
                print(f"Sheet {sheet_name} skipped: {sheet_error}")

        if rooms_to_insert:
            db.bulk_save_objects(rooms_to_insert)
            db.commit()
        else:
            db.delete(new_project)
            db.commit()
            raise HTTPException(status_code=400, detail="No rooms could be extracted from Excel structure.")

        return {
            "message": "Project created successfully",
            "project_name": new_project.name,
            "project_id": new_project.id,
            "rooms_loaded": len(rooms_to_insert)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# DATA VIEW ROUTES (Project Isolated)
# =====================================================

@app.get("/spaces")
def spaces(project_id: str = Query(...), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Space).filter(Space.user_id == current_user["sub"], Space.project_id == project_id).all()

@app.get("/spaces/summary")
def summary(project_id: str = Query(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return department_summary(project_id, db)

@app.get("/spaces/buildings")
def buildings(project_id: str = Query(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return building_summary(project_id, db)

@app.get("/spaces/floors")
def floors(project_id: str = Query(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return floor_summary(project_id, db)

# =====================================================
# AUTHENTICATION
# =====================================================

@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user: raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=request.username, email=request.email, password_hash=hash_password(request.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user_id": user.id}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "username": user.username})
    return {"message": "Login successful", "access_token": token, "token_type": "bearer", "user_id": user.id, "username": user.username}

@app.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user

# =====================================================
# DASHBOARD
# =====================================================

@app.get("/dashboard")
def dashboard(project_id: str = None, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["sub"]

    if not project_id:
        latest_project = db.query(Project).filter(Project.user_id == user_id).order_by(Project.uploaded_at.desc()).first()
        if not latest_project: return {"total_area": 0, "total_rooms": 0, "total_departments": 0, "total_buildings": 0, "area": 0, "top_departments": [], "buildings": [], "floors": [], "top_rooms": []}
        project_id = latest_project.id

    project_check = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project_check: raise HTTPException(status_code=403, detail="Unauthorized project access.")

    df = get_project_spaces_df(project_id, db)

    if df.empty: return {"total_area": 0, "total_rooms": 0, "total_departments": 0, "total_buildings": 0, "area": 0, "top_departments": [], "buildings": [], "floors": [], "top_rooms": []}

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
        "top_departments": department_summary(project_id, db)[:10],
        "buildings": building_summary(project_id, db),
        "floors": floor_summary(project_id, db),
        "top_rooms": top_rooms(project_id, db, 10)
    }