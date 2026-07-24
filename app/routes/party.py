from flask import Blueprint, jsonify
from ..models.result import Party

party_bp = Blueprint("party", __name__)

@party_bp.route("/parties", methods=["GET"])
def get_parties():
    parties = Party.query.order_by(Party.name).all()

    return jsonify([
        {
            "id": str(p.id),
            "name": p.name,
            "acronym": p.acronym
        }
        for p in parties
    ])