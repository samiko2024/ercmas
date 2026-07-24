import uuid
from datetime import datetime
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Info
    full_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    phone = db.Column(db.String)

    password_hash = db.Column(db.String, nullable=False)

    # Role
    role = db.Column(db.String, nullable=False)

    # 🔗 Assignments (ONLY ONE SHOULD BE USED BASED ON ROLE)

    assigned_polling_unit_id = db.Column(db.UUID(as_uuid=True))
    assigned_ward_id = db.Column(db.UUID(as_uuid=True))
    assigned_lga_id = db.Column(db.UUID(as_uuid=True))
    assigned_state_id = db.Column(db.UUID(as_uuid=True))

    created_at = db.Column(db.DateTime, default=datetime.now)
