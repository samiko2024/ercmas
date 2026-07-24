from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..extensions import db
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
from ..models.result import PUResult, PUResultVote, IncidentReport
from ..models.user import User
import uuid
import os
import traceback

pu_results_bp = Blueprint("results", __name__)

# Append these allowed formats at the top of routes/pu_results.py if they aren't there
ALLOWED_MEDIA_EXTENSIONS = {"png", "jpg", "jpeg", "mp4", "mov", "avi"}


def allowed_media_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_MEDIA_EXTENSIONS


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}



def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@pu_results_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_result():
    result = None
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User profile context not resolved"}), 404

        if user.role not in ["POLLING_AGENT", "FIELD_OFFICER"]:
            return jsonify({"error": "Unauthorized: Insufficient clearing privileges"}), 403

        parsed_party_votes = []
        ec8a_file_object = None

        # 1. Parse Input Data (Handling both form-data and raw JSON payload profiles)
        if request.content_type and "multipart/form-data" in request.content_type:
            accredited = int(request.form.get("total_accredited_voters") or 0)
            total_votes = int(request.form.get("total_votes_cast") or 0)
            rejected = int(request.form.get("rejected_votes") or 0)

            if "ec8a_file" in request.files:
                ec8a_file_object = request.files["ec8a_file"]

            # Safe processing loop for dynamic party inputs
            for key, value in request.form.items():
                if key.startswith("party_votes[") and key.endswith("]"):
                    party_id_str = key[12:-1].strip()
                    if party_id_str and value != "":
                        parsed_party_votes.append({
                            "party_id": party_id_str,
                            "votes": int(value or 0)
                        })
        else:
            data = request.get_json() or {}
            accredited = int(data.get("total_accredited_voters") or 0)
            total_votes = int(data.get("total_votes_cast") or 0)
            rejected = int(data.get("rejected_votes") or 0)
            parsed_party_votes = data.get("party_votes", [])

        # 2. Field Metrics Validation Assertions
        if accredited == 0 or total_votes == 0:
            return jsonify({"error": "Missing required statistical field summaries"}), 400

        if total_votes > accredited:
            return jsonify({"error": "Over-voting detected"}), 400

        polling_unit_id = getattr(user, "polling_unit_id", None) or getattr(user, "assigned_polling_unit_id", None)
        if not polling_unit_id:
            return jsonify({"error": "User profile has no associated polling unit credentials assigned"}), 400

        existing = PUResult.query.filter_by(polling_unit_id=polling_unit_id).first()
        if existing:
            return jsonify({"error": "Data Integrity Conflict: Results already locked for this polling unit"}), 400

        # 3. File Persistence Layer Processing
        ec8a_url = None
        if ec8a_file_object and ec8a_file_object.filename != '':
            if allowed_file(ec8a_file_object.filename):
                filename = secure_filename(f"{uuid.uuid4()}_{ec8a_file_object.filename}")
                upload_folder = os.path.join(current_app.root_path, "static", "uploads")

                # Ensure directory architecture paths exist locally on the disk
                os.makedirs(upload_folder, exist_ok=True)
                # Execute hard save to disk
                ec8a_file_object.save(os.path.join(upload_folder, filename))
                ec8a_url = f"/static/uploads/{filename}"
            else:
                return jsonify({"error": "File type extension not allowed"}), 400

        # 4. Save Database Structures
        result = PUResult(
            polling_unit_id=polling_unit_id,
            submitted_by=user.id,
            total_accredited_voters=accredited,
            total_votes_cast=total_votes,
            rejected_votes=rejected,
            ec8a_url=ec8a_url,
            status="PENDING",
            submitted_at=datetime.utcnow()
        )

        db.session.add(result)
        db.session.flush()  # Populates result.id dynamically

        # Save individual party entries to database
        for pv in parsed_party_votes:
            try:
                party_uuid = uuid.UUID(str(pv["party_id"]))
            except ValueError:
                db.session.rollback()
                return jsonify(
                    {"error": f"Invalid UUID formatting structure on party identity tracking: {pv['party_id']}"}), 400

            vote = PUResultVote(
                pu_result_id=result.id,
                party_id=party_uuid,
                votes=int(pv["votes"])
            )
            db.session.add(vote)

        db.session.commit()
        return jsonify({"message": "Result processed successfully", "result_id": str(result.id)}), 201

    except IntegrityError as ie:
        db.session.rollback()
        print("DATABASE INTEGRITY ERROR:", ie)
        return jsonify({"error": f"Database validation layer conflict: {str(ie.orig)}"}), 400

    except Exception as e:
        db.session.rollback()
        print("--- CRITICAL TRACEBACK ERROR LOG ---")
        traceback.print_exc()
        return jsonify({"error": f"Submission failed: {str(e)}"}), 500




# ========================================================
# INCIDENT REPORTING ROUTE BOUNDARY
# ========================================================
@pu_results_bp.route("/report-incident", methods=["POST"])
@jwt_required()
def report_incident():
    try:
        # Resolve reporting agent's identity context via JWT Token
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User identity context could not be verified"}), 404

        # Enforce that request payload is sent via form data boundary
        if not request.content_type or "multipart/form-data" not in request.content_type:
            return jsonify({"error": "Unsupported Media Type: Use multipart/form-data structure"}), 415

        # Extract textual fields from structural components
        incident_type = request.form.get("type")
        description = request.form.get("description")

        if not incident_type or not description:
            return jsonify({"error": "Missing mandatory field metrics: description or type"}), 400

        # Extract file asset stream binary data
        media_file = request.files.get("media")
        if not media_file or media_file.filename == "":
            return jsonify({"error": "Missing incident evidence payload file attachment"}), 400

        # Handle geographical authorization parameters (prioritize Form Data payload or fallback to DB User)
        polling_unit_id = request.form.get("polling_unit_id") or getattr(user, "assigned_polling_unit_id",
                                                                         None) or getattr(user, "polling_unit_id", None)
        ward_id = request.form.get("ward_id") or getattr(user, "assigned_ward_id", None)
        lga_id = request.form.get("lga_id") or getattr(user, "assigned_lga_id", None)
        state_id = request.form.get("state_id") or getattr(user, "assigned_state_id", None)

        # File Processing Strategy Layer
        media_url = None
        if allowed_media_file(media_file.filename):
            filename = secure_filename(f"INCIDENT_{uuid.uuid4()}_{media_file.filename}")
            upload_folder = os.path.join(current_app.root_path, "static", "uploads")

            # Guarantee asset architecture directories exist locally on disk
            os.makedirs(upload_folder, exist_ok=True)

            # Execute physical write operation to host storage layer
            media_file.save(os.path.join(upload_folder, filename))
            media_url = f"/static/uploads/{filename}"
        else:
            return jsonify({"error": "File type extension profile not supported for evidence logs"}), 400

        # Construct instance mappings dynamically (Use the exact name of your Model class here)
        incident_report = IncidentReport(
            type=incident_type,
            description=description,
            media_url=media_url,
            submitted_by=user.id,
            polling_unit_id=uuid.UUID(str(polling_unit_id)) if polling_unit_id else None,
            ward_id=uuid.UUID(str(ward_id)) if ward_id else None,
            lga_id=uuid.UUID(str(lga_id)) if lga_id else None,
            state_id=uuid.UUID(str(state_id)) if state_id else None,
            created_at=datetime.utcnow()
        )

        db.session.add(incident_report)
        db.session.commit()

        return jsonify({
            "message": "Incident reported successfully",
            "incident_id": str(incident_report.id)
        }), 201

    except ValueError as ve:
        db.session.rollback()
        return jsonify({"error": f"Invalid structural formatting tracking values: {str(ve)}"}), 400

    except Exception as e:
        db.session.rollback()
        print("--- CRITICAL TRACEBACK ERROR LOG (INCIDENT SUBMISSION) ---")
        traceback.print_exc()
        return jsonify({"error": f"Internal server incident logging failed: {str(e)}"}), 500
