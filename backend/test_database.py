from sqlalchemy import text

from database import engine


with engine.connect() as connection:
    result = connection.execute(text("SELECT 1"))

    print("✅ SQLAlchemy → PostgreSQL connection successful!")
    print("Test result:", result.scalar())