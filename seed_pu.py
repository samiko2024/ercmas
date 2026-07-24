from app import create_app
from app.extensions import db
from app.models.location import Ward, PollingUnit
import uuid

app = create_app()

with app.app_context():

    wards = Ward.query.all()

    for ward in wards:
        # Create 5 polling units per ward
        for i in range(1, 6):
            pu = PollingUnit(
                id=uuid.uuid4(),
                name=f"{ward.name} PU {i}",
                code=f"{ward.name[:3].upper()}-{i}",
                ward_id=ward.id
            )
            db.session.add(pu)

    db.session.commit()
    print("Polling Units Seeded ✅")