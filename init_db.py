import sys
from pathlib import Path

# Make backend modules available
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect
from database import Base, engine
import models  # Registers User, Interaction and AuditLog models


def initialize_database():
    print("Connecting to PostgreSQL...")

    # Create missing tables only; existing tables are not dropped.
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("\nDatabase tables:")
    for table in sorted(tables):
        print(f"- {table}")

    if "audit_logs" in tables:
        print("\nSUCCESS: audit_logs table exists.")
    else:
        raise RuntimeError("audit_logs table was not created.")


if __name__ == "__main__":
    initialize_database()