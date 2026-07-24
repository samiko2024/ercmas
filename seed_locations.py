import json
from app import create_app
from app.extensions import db
from app.models.location import State, LGA

app = create_app()

def seed_locations():
    with app.app_context():

        print("🌱 Seeding Nigeria States + LGAs...")

        # Load JSON
        with open("nigeria_states_lgas.json") as f:
            data = json.load(f)

        for state_data in data:
            state_name = state_data["name"]

            # ✅ Check if state exists
            state = State.query.filter_by(name=state_name).first()

            if not state:
                state = State(name=state_name)
                db.session.add(state)
                db.session.flush()  # get state.id
                print(f"✅ Added State: {state_name}")
            else:
                print(f"⚠️ State exists: {state_name}")

            # ✅ Add LGAs
            for lga_name in state_data["lgas"]:
                exists = LGA.query.filter_by(
                    name=lga_name,
                    state_id=state.id
                ).first()

                if not exists:
                    lga = LGA(name=lga_name, state_id=state.id)
                    db.session.add(lga)
                    print(f"   ➕ LGA: {lga_name}")
                else:
                    print(f"   ⚠️ LGA exists: {lga_name}")

        db.session.commit()
        print("🎉 Seeding complete!")

if __name__ == "__main__":
    seed_locations()