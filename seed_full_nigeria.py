import json
import uuid
from app import create_app
from app.extensions import db
from app.models.location import State, LGA, Ward, PollingUnit

app = create_app()

DATASET_FILE = "nigeria-wards.json"  # your dataset

def get_or_create_state(name):
    state = State.query.filter_by(name=name).first()
    if not state:
        state = State(id=uuid.uuid4(), name=name)
        db.session.add(state)
        db.session.flush()
    return state


def get_or_create_lga(name, state_id):
    lga = LGA.query.filter_by(name=name, state_id=state_id).first()
    if not lga:
        lga = LGA(id=uuid.uuid4(), name=name, state_id=state_id)
        db.session.add(lga)
        db.session.flush()
    return lga


def get_or_create_ward(name, lga_id):
    ward = Ward.query.filter_by(name=name, lga_id=lga_id).first()
    if not ward:
        ward = Ward(id=uuid.uuid4(), name=name, lga_id=lga_id)
        db.session.add(ward)
        db.session.flush()
    return ward


def generate_pu_code(state, lga, ward, index):
    return f"{state[:3].upper()}-{lga[:3].upper()}-{ward[:3].upper()}-{index}"


#def create_polling_units(ward, state_name, lga_name, ward_name):
#    existing = PollingUnit.query.filter_by(ward_id=ward.id).count()
#
#    # If already seeded, skip (IMPORTANT)
#    if existing > 0:
#        return 0
#
#    created = 0
#
#    for i in range(1, 6):  # 5 PUs per ward (adjust if needed)
#        code = generate_pu_code(state_name, lga_name, ward_name, i)
#
#        # Avoid duplicate code globally
#        if PollingUnit.query.filter_by(code=code).first():
#            continue
#
#        pu = PollingUnit(
#            id=uuid.uuid4(),
#            name=f"{ward_name} PU {i}",
#            code=code,
#            ward_id=ward.id
#        )
#
#        db.session.add(pu)
#        created += 1
#
#    return created


def seed():
    with app.app_context():
        print("🚀 Starting Nigeria full seed...")

        with open(DATASET_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        total_states = 0
        total_lgas = 0
        total_wards = 0
        total_pus = 0

        for state_name, state_data in data.items():
            state = get_or_create_state(state_name)
            total_states += 1

            for lga_item in state_data.get("lgas", []):
                lga_name = lga_item.get("name")

                lga = get_or_create_lga(lga_name, state.id)
                total_lgas += 1

                for ward_item in lga_item.get("wards", []):
                    ward_name = ward_item.get("name")

                    ward = get_or_create_ward(ward_name, lga.id)
                    total_wards += 1

                    created_pu = create_polling_units(
                        ward,
                        state_name,
                        lga_name,
                        ward_name
                    )

                    total_pus += created_pu

        db.session.commit()

        print("\n✅ SEED COMPLETE")
        print(f"States: {total_states}")
        print(f"LGAs: {total_lgas}")
        print(f"Wards: {total_wards}")
        print(f"Polling Units Created: {total_pus}")


if __name__ == "__main__":
    seed()