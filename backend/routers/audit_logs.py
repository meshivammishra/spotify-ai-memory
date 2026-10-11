from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session


def create_audit_logs_router(get_db, AuditLog, require_admin):
    router = APIRouter(tags=["Admin Audit Logs"])

    @router.get("/admin/audit-logs")
    def get_audit_logs(
        limit: int = Query(default=50, ge=1, le=100),
        offset: int = Query(default=0, ge=0),
        db: Session = Depends(get_db),
        admin_id: str = Depends(require_admin),
    ):
        total = db.scalar(
            select(func.count()).select_from(AuditLog)
        )

        records = db.scalars(
            select(AuditLog)
            .order_by(desc(AuditLog.created_at), desc(AuditLog.id))
            .offset(offset)
            .limit(limit)
        ).all()

        return {
            "total": total or 0,
            "limit": limit,
            "offset": offset,
            "audit_logs": [
                {
                    "id": item.id,
                    "user_id": item.user_id,
                    "action": item.action,
                    "memory_id": item.memory_id,
                    "details": item.details,
                    "created_at": (
                        item.created_at.isoformat()
                        if item.created_at
                        else None
                    ),
                }
                for item in records
            ],
        }

    return router