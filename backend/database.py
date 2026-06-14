from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import (
    declarative_base,
    sessionmaker,
    relationship,
)
from datetime import datetime
from dotenv import load_dotenv
import uuid
import os

# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception(
        "DATABASE_URL not found. Add it to .env or Render environment variables."
    )

# =====================================================
# DATABASE ENGINE
# =====================================================

# Convert Neon URL to psycopg driver
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1,
    )

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# =====================================================
# SESSION FACTORY
# =====================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# =====================================================
# BASE MODEL
# =====================================================

Base = declarative_base()

# =====================================================
# USERS TABLE
# =====================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    uploads = relationship(
        "Upload",
        back_populates="owner",
        cascade="all, delete",
    )

# =====================================================
# UPLOADS TABLE
# =====================================================

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(
        String,
        primary_key=True,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    file_type = Column(
        String,
        nullable=False,
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    owner = relationship(
        "User",
        back_populates="uploads",
    )

# =====================================================
# SPACE INVENTORY TABLE
# =====================================================

class Space(Base):
    __tablename__ = "spaces"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
    )
    building = Column(String)
    floor = Column(String)

    dept_location = Column(String)

    room_name = Column(String)

    room_number = Column(String)

    door_number = Column(String)

    occupant = Column(String)

    department = Column(String)

    department_head = Column(String)

    cost_center = Column(String)

    shared = Column(String)

    area = Column(Float)

# =====================================================
# DATABASE DEPENDENCY
# =====================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# =====================================================
# CREATE TABLES
# =====================================================

def init_db():
    Base.metadata.create_all(bind=engine)