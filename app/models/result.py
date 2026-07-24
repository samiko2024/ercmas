import uuid
from datetime import datetime
from ..extensions import db

class PUResult(db.Model):
    __tablename__ = "pu_results"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    polling_unit_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("polling_units.id"))
    submitted_by = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"))

    total_accredited_voters = db.Column(db.Integer, nullable=False)
    total_votes_cast = db.Column(db.Integer, nullable=False)
    rejected_votes = db.Column(db.Integer, default=0)

    # SECURE CLOUD STORAGE STORAGE URL (AWS S3, Cloudinary, or Local Upload Paths)
    ec8a_url = db.Column(db.String(512), nullable=True)

    status = db.Column(db.String, default="PENDING")
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint(
            "total_votes_cast <= total_accredited_voters",
            name="check_over_voting"
        ),
        db.UniqueConstraint("polling_unit_id", name="unique_pu_submission"),
    )


class Party(db.Model):
    __tablename__ = "parties"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    acronym = db.Column(db.String, unique=True, nullable=False)


class PUResultVote(db.Model):
    __tablename__ = "pu_result_votes"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    pu_result_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("pu_results.id", ondelete="CASCADE")
    )
    party_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("parties.id"))

    votes = db.Column(db.Integer, nullable=False)



# Models reference (e.g., inside models/incident.py or result.py)
class IncidentReport(db.Model):
    __tablename__ = 'incident_reports'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.String(255), nullable=False)

    # Spatial authorization node linking
    polling_unit_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('polling_units.id'), nullable=True)
    ward_id = db.Column(db.UUID(as_uuid=True), nullable=True)
    lga_id = db.Column(db.UUID(as_uuid=True), nullable=True)
    state_id = db.Column(db.UUID(as_uuid=True), nullable=True)

    submitted_by = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WardCollationReport(db.Model):
    __tablename__ = 'ward_collation_reports'

    # Primary Unique Audit Reference ID
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Structural Administrative Mapping Relationships
    ward_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('wards.id'), nullable=False)
    submitted_by = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)

    # Telemetry and Compilation Metadata Metrics
    total_votes = db.Column(db.Integer, nullable=False, default=0)

    # Threat & Discrepancy Forensic Indicators
    has_anomalies = db.Column(db.Boolean, nullable=False, default=False)
    anomalies_reported = db.Column(db.Text, nullable=True)  # Detailed narrative field

    # File Storage System URL Pointer Path (EC8B Scanned Copy)
    collation_sheet_url = db.Column(db.String(500), nullable=False)

    # Forensic Time Anchoring Stamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Database Relationship Hooks for clean cross-joining queries
    ward = db.relationship('Ward', backref=db.backref('collation_reports', lazy=True))
    supervisor = db.relationship('User', backref=db.backref('submitted_ward_reports', lazy=True))

    def __init__(self, id, ward_id, submitted_by, total_votes, has_anomalies, anomalies_reported, collation_sheet_url):
        self.id = id if id else uuid.uuid4()
        self.ward_id = ward_id
        self.submitted_by = submitted_by
        self.total_votes = total_votes
        self.has_anomalies = has_anomalies
        self.anomalies_reported = anomalies_reported if has_anomalies else None
        self.collation_sheet_url = collation_sheet_url

    def to_dict(self):
        """Converts database entities effortlessly to JSON payloads for API returns."""
        return {
            "id": str(self.id),
            "ward_id": str(self.ward_id),
            "ward_name": self.ward.name if self.ward else None,
            "submitted_by": str(self.submitted_by),
            "supervisor_name": self.supervisor.full_name if self.supervisor else None,
            "total_votes": self.total_votes,
            "has_anomalies": self.has_anomalies,
            "anomalies_reported": self.anomalies_reported,
            "collation_sheet_url": self.collation_sheet_url,
            "created_at": self.created_at.isoformat()
        }