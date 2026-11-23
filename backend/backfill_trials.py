from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from app.models.chama import Chama
from app.models.trial import ChamaTrial
from datetime import datetime

app = create_app()
with app.app_context():
    n = 0
    for c in Chama.query.all():
        if not ChamaTrial.query.filter_by(chama_id=c.id).first():
            db.session.add(ChamaTrial(
                chama_id=c.id,
                tier=c.base_tier or 'Growth',
                status='active',
                started_at=datetime.utcnow(),
                ends_at=datetime.utcnow(),
                converted_at=datetime.utcnow(),
                converted_tier=c.base_tier or 'Growth',
            ))
            n += 1
    db.session.commit()
    print(f"Backfilled {n} chamas as 'active'")
    print(f"Total trial rows: {ChamaTrial.query.count()}")
