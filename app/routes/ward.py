import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from ..models.result import WardCollationReport # Ensure these are imported from your models setup
from ..models.user import User
from ..models.location import Ward, LGA, State
from ..extensions import db
ward_bp = Blueprint("ward", __name__)

# Allowed configuration extensions for physical source evidence scans
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@ward_bp.route("/submit-report", methods=["POST"])
@jwt_required()
def submit_ward_report():
    supervisor_id = uuid.UUID(get_jwt_identity())
    supervisor = db.session.get(User, supervisor_id)

    # 1. Authorization Guard Gate
    if not supervisor or supervisor.role not in ["ADMIN", "WARD_AGENT"]:
        return jsonify({"error": "Unauthorized: Requires Supervisor or Admin Clearance"}), 403

    # Ensure the supervisor is assigned to a specific ward jurisdiction
    assigned_ward_id = supervisor.assigned_ward_id
    if not assigned_ward_id and supervisor.role != "ADMIN":
        return jsonify({"error": "Operational Configuration Error: No Ward context mapped to this user accounts"}), 400

    # 2. Extract Multi-part Form Text Payload Properties
    total_votes = request.form.get("total_votes", type=int)
    anomalies_reported = request.form.get("anomalies_reported", default="")
    has_anomalies = request.form.get("has_anomalies", default="false").lower() == "true"

    # Use explicitly posted ward_id if Admin, else fallback to supervisor context
    target_ward_id = request.form.get("ward_id") or str(assigned_ward_id)

    if total_votes is None:
        return jsonify({"error": "Missing critical telemetry payload parameters: total_votes"}), 400

    # 3. Handle File Upload (Targeting static/uploads directory relative to root)
    file_url = None
    if 'collation_sheet' in request.files:
        file = request.files['collation_sheet']
        if file:
            if allowed_file(file.filename):
                # Format filename using target ward ID and random UUID segment
                filename = secure_filename(f"ward_{target_ward_id}_{uuid.uuid4().hex[:8]}_{file.filename}")

                # Resolve paths dynamically using current_app.root_path
                upload_folder = os.path.join(current_app.root_path, "static", "uploads")

                # Guarantee asset architecture directories exist locally on disk
                os.makedirs(upload_folder, exist_ok=True)

                # Execute physical write operation to host storage layer
                file.save(os.path.join(upload_folder, filename))

                # Expose public-facing static URL routing map
                file_url = f"/static/uploads/{filename}"
            else:
                return jsonify({"error": "File type extension profile not supported for collation sheets"}), 400

    if not file_url:
        return jsonify({
                           "error": "Missing verification document layer: Please attach a valid scan of the ward collation sheet"}), 400

    # 4. Persistence Entry Block inside database ledger transaction
    try:
        report = WardCollationReport(
            id=uuid.uuid4(),
            ward_id=uuid.UUID(target_ward_id),
            submitted_by=supervisor_id,
            total_votes=total_votes,
            has_anomalies=has_anomalies,
            anomalies_reported=anomalies_reported,
            collation_sheet_url=file_url
        )
        db.session.add(report)
        db.session.commit()

        return jsonify({
            "message": "Ward-level Collation Report successfully logged and compiled into audit layer ledger",
            "report_id": str(report.id)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database transaction execution failure: {str(e)}"}), 500


@ward_bp.route("/national-reports", methods=["GET"])
@jwt_required()
def get_national_ward_reports():
    admin_id = uuid.UUID(get_jwt_identity())
    admin = db.session.get(User, admin_id)

    if not admin or admin.role != "ADMIN":
        return jsonify({"error": "Unauthorized: Command Room Access Only"}), 403

    # Query reports and join location structures
    reports = db.session.query(
        WardCollationReport,
        Ward.name.label("ward_name"),
        LGA.name.label("lga_name"),
        State.name.label("state_name"),
        User.full_name.label("supervisor_name"),
        User.phone.label("supervisor_phone")
    ).join(Ward, WardCollationReport.ward_id == Ward.id)\
     .join(LGA, Ward.lga_id == LGA.id)\
     .join(State, LGA.state_id == State.id)\
     .join(User, WardCollationReport.submitted_by == User.id)\
     .order_by(WardCollationReport.created_at.desc()).all()

    result = []
    for report, ward_name, lga_name, state_name, supervisor_name, supervisor_phone in reports:
        result.append({
            "id": str(report.id),
            "ward_name": ward_name,
            "lga_name": lga_name,
            "state_name": state_name,
            "total_votes": report.total_votes,
            "has_anomalies": report.has_anomalies,
            "anomalies_reported": report.anomalies_reported,
            "collation_sheet_url": report.collation_sheet_url,
            "submitted_by_name": supervisor_name,
            "submitted_by_phone": supervisor_phone or "N/A",
            "created_at": report.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(result)