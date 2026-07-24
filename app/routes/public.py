import uuid
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from ..models.result import PUResult, PUResultVote, Party
from ..extensions import db
from ..models.location import PollingUnit, Ward, LGA, State

public_bp = Blueprint("public", __name__)


# ==========================================
# REUSABLE PIPELINE AGGREGATION ENGINE
# ==========================================
def execute_location_aggregation(filter_condition):
    """
    Traces individual PU submissions up through geographic structures 
    to output perfectly structured metrics for the dashboard.
    """
    # 1. Fetch Aggregated Summary Metrics
    summary_query = db.session.query(
        func.sum(PUResult.total_votes_cast),
        func.sum(PUResult.total_accredited_voters)
    ).join(
        # We target the text name of your relationship or look up by model configuration
        "polling_unit"
    ).filter(filter_condition).first()

    total_votes = int(summary_query[0] or 0) if summary_query else 0
    total_accredited = int(summary_query[1] or 0) if summary_query else 0

    turnout = 0
    if total_accredited > 0:
        turnout = round((total_votes / total_accredited) * 100, 2)

    # 2. Fetch Aggregated Party Metrics
    # Dynamic text join maps straight across standard multi-tiered location foreign keys
    party_query = db.session.query(
        Party.acronym,
        func.sum(PUResultVote.votes)
    ).join(PUResultVote, Party.id == PUResultVote.party_id) \
        .join(PUResult, PUResult.id == PUResultVote.pu_result_id) \
        .join("polling_unit") \
        .filter(filter_condition) \
        .group_by(Party.acronym).all()

    parties = [
        {"acronym": row[0], "votes": int(row[1] or 0)}
        for row in party_query
    ]

    return {
        "summary": {
            "total_votes": total_votes,
            "total_accredited": total_accredited,
            "turnout": turnout
        },
        "parties": parties
    }


# ==========================================
# 1. GLOBAL / NATIONAL DATA ENDPOINT
# ==========================================
@public_bp.route("/results", methods=["GET"])
def get_national_results():
    summary_query = db.session.query(
        func.sum(PUResult.total_votes_cast),
        func.sum(PUResult.total_accredited_voters)
    ).first()

    total_votes = int(summary_query[0] or 0) if summary_query else 0
    total_accredited = int(summary_query[1] or 0) if summary_query else 0

    turnout = 0
    if total_accredited > 0:
        turnout = round((total_votes / total_accredited) * 100, 2)

    party_results = db.session.query(
        Party.acronym,
        func.sum(PUResultVote.votes)
    ).join(PUResultVote, Party.id == PUResultVote.party_id) \
        .group_by(Party.acronym).all()

    parties = [
        {"acronym": row[0], "votes": int(row[1] or 0)}
        for row in party_results
    ]

    return jsonify({
        "summary": {
            "total_votes": total_votes,
            "total_accredited": total_accredited,
            "turnout": turnout
        },
        "parties": parties
    })


# ==========================================
# 2. STATE OVERVIEW FILTER
# ==========================================
@public_bp.route("/results/state/<string:state_id>", methods=["GET"])
def get_state_results(state_id):
    try:
        state_uuid = uuid.UUID(state_id)
        # Dynamic manual relationship matching text keys inside your submodels

        condition = (LGA.state_id == state_uuid)

        # We stitch the joins together through the core hierarchy to calculate the values
        summary = db.session.query(
            func.sum(PUResult.total_votes_cast),
            func.sum(PUResult.total_accredited_voters)
        ).select_from(PUResult) \
            .join(PollingUnit, PollingUnit.id == PUResult.polling_unit_id) \
            .join(Ward, Ward.id == PollingUnit.ward_id) \
            .join(LGA, LGA.id == Ward.lga_id) \
            .filter(condition).first()

        parties_data = db.session.query(Party.acronym, func.sum(PUResultVote.votes)) \
            .join(PUResultVote, Party.id == PUResultVote.party_id) \
            .join(PUResult, PUResult.id == PUResultVote.pu_result_id) \
            .join(PollingUnit, PollingUnit.id == PUResult.polling_unit_id) \
            .join(Ward, Ward.id == PollingUnit.ward_id) \
            .join(LGA, LGA.id == Ward.lga_id) \
            .filter(condition).group_by(Party.acronym).all()

        total_v = int(summary[0] or 0) if summary else 0
        total_a = int(summary[1] or 0) if summary else 0

        return jsonify({
            "summary": {"total_votes": total_v, "total_accredited": total_a,
                        "turnout": round((total_v / total_a) * 100, 2) if total_a > 0 else 0},
            "parties": [{"acronym": r[0], "votes": int(r[1] or 0)} for r in parties_data]
        })
    except ValueError:
        return jsonify({"error": "Invalid UUID string context format supplied"}), 400


# ==========================================
# 3. LGA OVERVIEW FILTER
# ==========================================
@public_bp.route("/results/lga/<string:lga_id>", methods=["GET"])
def get_lga_results(lga_id):
    try:
        lga_uuid = uuid.UUID(lga_id)

        condition = (Ward.lga_id == lga_uuid)

        summary = db.session.query(func.sum(PUResult.total_votes_cast), func.sum(PUResult.total_accredited_voters)) \
            .select_from(PUResult).join(PollingUnit).join(Ward).filter(condition).first()

        parties_data = db.session.query(Party.acronym, func.sum(PUResultVote.votes)) \
            .join(PUResultVote).join(PUResult).join(PollingUnit).join(Ward).filter(condition).group_by(
            Party.acronym).all()

        total_v = int(summary[0] or 0) if summary else 0
        total_a = int(summary[1] or 0) if summary else 0

        return jsonify({
            "summary": {"total_votes": total_v, "total_accredited": total_a,
                        "turnout": round((total_v / total_a) * 100, 2) if total_a > 0 else 0},
            "parties": [{"acronym": r[0], "votes": int(r[1] or 0)} for r in parties_data]
        })
    except ValueError:
        return jsonify({"error": "Invalid UUID context format"}), 400


# ==========================================
# 4. WARD OVERVIEW FILTER
# ==========================================
@public_bp.route("/results/ward/<string:ward_id>", methods=["GET"])
def get_ward_results(ward_id):
    try:
        ward_uuid = uuid.UUID(ward_id)


        condition = (PollingUnit.ward_id == ward_uuid)

        summary = db.session.query(func.sum(PUResult.total_votes_cast), func.sum(PUResult.total_accredited_voters)) \
            .select_from(PUResult).join(PollingUnit).filter(condition).first()

        parties_data = db.session.query(Party.acronym, func.sum(PUResultVote.votes)) \
            .join(PUResultVote).join(PUResult).join(PollingUnit).filter(condition).group_by(Party.acronym).all()

        total_v = int(summary[0] or 0) if summary else 0
        total_a = int(summary[1] or 0) if summary else 0

        return jsonify({
            "summary": {"total_votes": total_v, "total_accredited": total_a,
                        "turnout": round((total_v / total_a) * 100, 2) if total_a > 0 else 0},
            "parties": [{"acronym": r[0], "votes": int(r[1] or 0)} for r in parties_data]
        })
    except ValueError:
        return jsonify({"error": "Invalid UUID context format"}), 400


# ==========================================
# 5. POLLING UNIT DETAILED LEVEL + SECURE EC8A
# ==========================================
@public_bp.route("/results/polling-unit/<string:pu_id>", methods=["GET"])
def get_polling_unit_results(pu_id):
    try:
        pu_uuid = uuid.UUID(pu_id)

        # 1. Pull core result row for this unit
        result_record = PUResult.query.filter_by(polling_unit_id=pu_uuid).first()

        if not result_record:
            return jsonify({
                "summary": {"total_votes": 0, "total_accredited": 0, "turnout": 0},
                "parties": [],
                "ec8a_url": None,
                "status": "NO_SUBMISSION"
            })

        # 2. Extract Turnout percentage parameters
        turnout = 0
        if result_record.total_accredited_voters > 0:
            turnout = round((result_record.total_votes_cast / result_record.total_accredited_voters) * 100, 2)

        # 3. Pull votes breakdown tracking
        vote_metrics = db.session.query(
            Party.acronym,
            PUResultVote.votes
        ).join(PUResultVote, Party.id == PUResultVote.party_id) \
            .filter(PUResultVote.pu_result_id == result_record.id).all()

        parties = [
            {"acronym": row[0], "votes": int(row[1] or 0)}
            for row in vote_metrics
        ]

        # 4. Generate data array alongside custom model values
        return jsonify({
            "summary": {
                "total_votes": int(result_record.total_votes_cast),
                "total_accredited": int(result_record.total_accredited_voters),
                "turnout": turnout,
                "rejected_votes": int(result_record.rejected_votes or 0)
            },
            "parties": parties,
            # Checks for an image path asset field if you decide to name it form_image or ec8a_url
            "ec8a_url": getattr(result_record, "ec8a_url", None) or getattr(result_record, "form_image_url", None),
            "status": result_record.status
        })

    except ValueError:
        return jsonify({"error": "Invalid UUID identifier string parameters format"}), 400

    # Add this endpoint inside your routes/public.py file:


@public_bp.route("/ward/<string:ward_id>/polling-units", methods=["GET"])
def get_ward_polling_units_list(ward_id):
    try:
        ward_uuid = uuid.UUID(ward_id)

        # Pull all polling units belonging to this specific ward structure
        units = PollingUnit.query.filter_by(ward_id=ward_uuid).all()

        return jsonify([
            {
                "id": str(pu.id),
                "name": pu.name,
                "code": pu.code
            } for pu in units
        ]), 200

    except ValueError:
        return jsonify({"error": "Invalid Ward UUID format context supplied"}), 400