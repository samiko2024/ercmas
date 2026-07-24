import uuid
from datetime import datetime
from ..extensions import db

class State(db.Model):
    __tablename__ = "states"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)


class LGA(db.Model):
    __tablename__ = "lgas"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    state_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("states.id"))


class Ward(db.Model):
    __tablename__ = "wards"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    lga_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("lgas.id"))


class PollingUnit(db.Model):
    __tablename__ = "polling_units"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, unique=True, nullable=False)
    ward_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("wards.id"))

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    registered_voters = db.Column(db.Integer)
