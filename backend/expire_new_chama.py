from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from app.models.user import User
from app.models.chama import Member
from app.models.trial import ChamaTrial
from datetime import datetime, timedelta

TARGET_EMAIL = "johndoe-test@example.com"

app = create_app()
with app.app_context():
    # Find the user and their chama
    user = User.query.filter_by(email=TARGET_EMAIL.lower().strip()).first()
    if not user:
        print(f"User {TARGET_EMAIL} not found. Did you complete the signup?")
    else:
        member = Member.query.filter_by(user_id=user.id).first()
        if not member:
            print("No chama membership found for this user.")
        else:
            trial = ChamaTrial.query.filter_by(chama_id=member.chama_id).first()
            if not trial:
                print("No trial record found for this chama.")
            else:
                trial.status = 'trialing' # ensure it's trialing
                trial.ends_at = datetime.utcnow() - timedelta(hours=1)
                db.session.commit()
                print(f"✅ Expired trial for {TARGET_EMAIL} (Chama: {member.chama_id})")
                print(f"New ends_at: {trial.ends_at}")
