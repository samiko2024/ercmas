from app import create_app, db
from app.models.result import Party

app = create_app()

with app.app_context():

    parties = [
        {"name": "Accord", "acronym": "A"},
        {"name": "Action Alliance", "acronym": "AA"},
        {"name": "Action Democratic Party", "acronym": "ADP"},
        {"name": "Action Peoples Party", "acronym": "APP"},
        {"name": "African Action Congress", "acronym": "AAC"},
        {"name": "African Democratic Congress", "acronym": "ADC"},
        {"name": "All Progressives Congress", "acronym": "APC"},
        {"name": "All Progressives Grand Alliance", "acronym": "APGA"},
        {"name": "Allied Peoples Movement", "acronym": "APM"},
        {"name": "Boot Party", "acronym": "BP"},
        {"name": "Democratic Leadership Alliance", "acronym": "DLA"},
        {"name": "National Democratic Party", "acronym": "NDP"},
        {"name": "National Rescue Movement", "acronym": "NRM"},
        {"name": "Nigeria Democratic Congress", "acronym": "NDC"},
        {"name": "Peoples Democratic Party", "acronym": "PDP"},
        {"name": "Youth Party", "acronym": "YP"},
        {"name": "Zenith Labour Party", "acronym": "ZLP"},
    ]

    added = 0
    skipped = 0

    for p in parties:
        existing = Party.query.filter_by(acronym=p["acronym"]).first()

        if existing:
            skipped += 1
            continue

        db.session.add(
            Party(
                name=p["name"],
                acronym=p["acronym"]
            )
        )
        added += 1

    db.session.commit()
