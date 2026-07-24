import json
from app import create_app
from app.extensions import db
from app.models.location import State, LGA, Ward

app = create_app()


# 🔧 Normalize names (VERY IMPORTANT)
def normalize(text):
    return text.strip().lower().replace("/", "").replace("-", "").replace(" ", "")


def seed_wards():
    with app.app_context():

        with open("nigeria-wards.json") as f:
            data = json.load(f)

        # Load all states + lgas once (faster)
        states = State.query.all()
        lgas = LGA.query.all()

        state_map = {normalize(s.name): s for s in states}

        lga_map = {}
        for l in lgas:
            key = (normalize(l.name), str(l.state_id))
            lga_map[key] = l

        total_inserted = 0
        total_skipped = 0

        for state_name, state_data in data.items():

            state_key = normalize(state_name)
            state = state_map.get(state_key)

            if not state:
                print(f"❌ STATE NOT FOUND: {state_name}")
                continue

            print(f"\n✅ STATE: {state.name}")

            for lga_data in state_data["lgas"]:

                lga_name = lga_data["name"]
                lga_key = (normalize(lga_name), str(state.id))

                lga = lga_map.get(lga_key)

                if not lga:
                    print(f"   ❌ LGA NOT FOUND: {lga_name}")
                    continue

                print(f"   ➜ LGA: {lga.name}")

                for ward_data in lga_data["wards"]:

                    ward_name = ward_data["name"]

                    # Check duplicate
                    exists = Ward.query.filter_by(
                        name=ward_name,
                        lga_id=lga.id
                    ).first()

                    if exists:
                        total_skipped += 1
                        continue

                    ward = Ward(
                        name=ward_name,
                        lga_id=lga.id
                    )

                    db.session.add(ward)
                    total_inserted += 1

        db.session.commit()

        print("\n🎉 DONE!")
        print(f"✅ Inserted: {total_inserted}")
        print(f"⏭ Skipped: {total_skipped}")
        lga = LGA.query.first()
        Ward.query.filter_by(lga_id=lga.id).count()




if __name__ == "__main__":
    seed_wards()