from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

db_url = settings.database_url
# Render/Heroku ให้ scheme postgres:// หรือ postgresql:// แต่โปรเจกต์ใช้ psycopg v3
# SQLAlchemy ต้องการ postgresql+psycopg:// ไม่งั้นจะไปหา psycopg2 (ที่ไม่ได้ติดตั้ง) แล้ว error
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
