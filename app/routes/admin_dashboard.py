from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from ..extensions import db
from ..models.result import PUResult, IncidentReport

# Assuming a PollingUnit lookup model layer exists
# from ..models.location import PollingUnit

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)


@admin_dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()  # Optional protection constraint
def get_dashboard_stats():
    try:
        # 1. Calculate sum of all votes cast recorded in PUResult table profiles
        total_votes_agg = db.session.query(func.sum(PUResult.total_votes_cast)).scalar() or 0

        # 2. Count distinct reporting rows inside database
        total_pus_reported = db.session.query(func.count(PUResult.id)).scalar() or 0

        # 3. Count total active incident rows flagged on server
        total_flags_count = db.session.query(func.count(IncidentReport.id)).scalar() or 0

        return jsonify({
            "total_votes": int(total_votes_agg),
            "total_results": int(total_pus_reported),
            "flags": int(total_flags_count)
        }), 200

    except Exception as e:
        print("❌ DASHBOARD STATS LOG ERROR:", str(e))
        return jsonify({"error": "Failed to compile analytical data matrices"}), 500


@admin_dashboard_bp.route("/recent-activities", methods=["GET"])
@jwt_required()
def get_recent_activities():
    try:
        unified_stream = []

        # Fetch recent incoming election results submissions
        results = PUResult.query.order_by(PUResult.submitted_at.desc()).limit(15).all()
        for r in results:
            unified_stream.append({
                "id": str(r.id),
                "type": "RESULT",
                "pu_id": str(r.polling_unit_id) if r.polling_unit_id else "N/A",
                "pu_name": f"Station #{str(r.polling_unit_id)[:8].upper()}" if r.polling_unit_id else "Unspecified Node",
                "votes": r.total_votes_cast,
                "flagged": False,
                "media_url": r.ec8a_url,  # Matches your relative path profile entry string
                "time": r.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if r.submitted_at else "Just Now"
            })

        # Fetch recent ground level security incident transmissions
        incidents = IncidentReport.query.order_by(IncidentReport.created_at.desc()).limit(15).all()
        for i in incidents:
            unified_stream.append({
                "id": str(i.id),
                "type": "INCIDENT",
                "pu_id": str(i.polling_unit_id) if i.polling_unit_id else "N/A",
                "pu_name": f"Station #{str(i.polling_unit_id)[:8].upper()}" if i.polling_unit_id else "Regional Node",
                "incident_type": i.type,
                "description": i.description,
                "flagged": True,  # Automatically flagged by classification property
                "media_url": i.media_url,
                "time": i.created_at.strftime("%Y-%m-%d %H:%M:%S") if i.created_at else "Just Now"
            })

        # Sort the composite dashboard activities timeline chronologically descending
        unified_stream.sort(key=lambda x: x["time"], reverse=True)

        # Slice down to output max 20 logs items to the client dashboard interface
        return jsonify(unified_stream[:20]), 200

    except Exception as e:
        print("❌ LIVE TRAIL LOG ERROR:", str(e))
        return jsonify({"error": f"Failed to sequence chronological system audit activities: {str(e)}"}), 500