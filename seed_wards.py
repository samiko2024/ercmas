import json
from app import create_app
from app.extensions import db
from app.models.location import State, LGA, Ward

app = create_app()

def seed_wards():
    with app.app_context():

        # Load your JSON file
        with open("nigeria-wards.json") as f:
            data = json.load(f)

        for state_name, state_data in data.items():

            # 🔍 Find existing state
            state = State.query.filter_by(name=state_name).first()

            if not state:
                print(f"❌ State not found in DB: {state_name}")
                continue

            print(f"✅ Processing State: {state_name}")

            for lga_data in state_data["lgas"]:

                lga_name = lga_data["name"]

                # 🔍 Find existing LGA under this state
                lga = LGA.query.filter_by(
                    name=lga_name,
                    state_id=state.id
                ).first()

                if not lga:
                    print(f"❌ LGA not found: {lga_name}")
                    continue

                print(f"   ➜ LGA: {lga_name}")

                for ward_data in lga_data["wards"]:

                    ward_name = ward_data["name"]

                    # 🔍 Check if ward already exists
                    existing_ward = Ward.query.filter_by(
                        name=ward_name,
                        lga_id=lga.id
                    ).first()

                    if existing_ward:
                        continue

                    # ✅ Insert ward
                    ward = Ward(
                        name=ward_name,
                        lga_id=lga.id
                    )

                    db.session.add(ward)

        db.session.commit()
        print("🎉 Wards seeded successfully!")


if __name__ == "__main__":
    seed_wards()