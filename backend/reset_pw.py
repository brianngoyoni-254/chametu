from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from app.models.user import User

TARGET_EMAIL = "dannymuthui118@gmail.com"
NEW_PASSWORD = "TestPass123"

app = create_app()
with app.app_context():
    u = User.query.filter_by(email=TARGET_EMAIL.lower().strip()).first()
    if not u:
        print(f"No user with email {TARGET_EMAIL}")
    else:
        u.set_password(NEW_PASSWORD)
        db.session.commit()
        print(f"Password reset for {u.email} -> {NEW_PASSWORD}")
