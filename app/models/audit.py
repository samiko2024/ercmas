import uuid
from datetime import datetime
from ..extensions import db
class Flag(db.Model):
    __tablename__ = "flags"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    level = db.Column(db.String)
    reference_id = db.Column(db.UUID(as_uuid=True))

    flag_type = db.Column(db.String)
    description = db.Column(db.String)

    status = db.Column(db.String, default="OPEN")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"))
    action = db.Column(db.String)

    entity_type = db.Column(db.String)
    entity_id = db.Column(db.UUID(as_uuid=True))

    metadata = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)