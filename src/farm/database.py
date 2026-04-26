import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from .models import Base, Wallet

# Default to a local sqlite file in the project root
DB_PATH = os.environ.get("FARM_DATABASE_URL", "sqlite:///farm.db")

engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migration_guard():
    """Ensure existing tables have the new columns for the Gacha system."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('agents')]
    
    with engine.connect() as conn:
        if 'title' not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN title VARCHAR"))
        if 'rarity' not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN rarity INTEGER DEFAULT 3"))
        if 'trait' not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN trait VARCHAR"))
        if 'system_prompt' not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN system_prompt TEXT"))
        conn.commit()

def ensure_wallet():
    """Ensure at least one wallet entry exists with starter cookies."""
    with SessionLocal() as db:
        wallet = db.query(Wallet).first()
        if not wallet:
            new_wallet = Wallet(cookies=500)
            db.add(new_wallet)
            db.commit()

def init_db():
    """Initialize the database tables and apply migrations."""
    Base.metadata.create_all(bind=engine)
    migration_guard()
    ensure_wallet()

def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
