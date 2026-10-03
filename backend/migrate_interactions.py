import json
from datetime import datetime
from pathlib import Path

from database import SessionLocal
from models import Interaction


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "interactions.json"


def migrate_interactions():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        interactions = json.load(file)

    db = SessionLocal()

    try:
        existing_count = db.query(Interaction).count()

        if existing_count > 0:
            print(
                f"⚠️ interactions table already contains "
                f"{existing_count} records."
            )
            print("Migration skipped to avoid duplicate records.")
            return

        inserted = 0

        for item in interactions:
            interaction = Interaction(
                user_id=item["user_id"],
                timestamp=datetime.fromisoformat(item["timestamp"]),
                type=item["type"],
                artist=item.get("artist"),
                track=item.get("track"),
                genre=item.get("genre"),
                context=item.get("context"),
                subject_scope="user",
                consent=True,
                source_event_id=f"json-{inserted + 1}",
                idempotency_key=f"interaction-{item['user_id']}-{item['timestamp']}",
            )

            db.add(interaction)
            inserted += 1

        db.commit()

        print(f"✅ Successfully migrated {inserted} interactions to PostgreSQL.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    migrate_interactions()