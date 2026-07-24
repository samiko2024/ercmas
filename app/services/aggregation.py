from ..models.result import PUResultVote, Party
from ..extensions import db

def aggregate_by(field, value):
    query = db.session.query(
        Party.acronym,
        db.func.sum(PUResultVote.votes)
    ).join(Party).group_by(Party.acronym)

    return [{"party": r[0], "votes": r[1]} for r in query]