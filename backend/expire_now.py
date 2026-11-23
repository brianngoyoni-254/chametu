from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from app.models.trial import ChamaTrial
from datetime import datetime, timedelta

app = create_app()
with app.app_context():
    t = ChamaTrial.query.filter_by(status='trialing').order_by(ChamaTrial.created_at.desc()).first()
    if not t:
        print("No trialing trial found")
    else:
        t.ends_at = datetime.utcnow() - timedelta(hours=1)
        db.session.commit()
        print(f"Expired trial for chama_id={t.chama_id} (ends_at={t.ends_at.isoformat()})")
