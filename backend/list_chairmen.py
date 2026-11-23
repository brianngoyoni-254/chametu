from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from app.models.user import User
from app.models.chama import Member, Chama

app = create_app()
with app.app_context():
    print("=== Chairmen ===")
    for m in Member.query.filter_by(role='Chairman').all():
        u = User.query.get(m.user_id)
        c = Chama.query.get(m.chama_id)
        if u and c:
            print(f"  email={u.email}")
            print(f"    name={u.name}")
            print(f"    chama={c.name} (code={c.code}, tier={c.base_tier})")
            print(f"    phone={u.phone}")
            print()

    print("=== First 5 users (any role) ===")
    for u in User.query.limit(5).all():
        m = Member.query.filter_by(user_id=u.id).first()
        role = m.role if m else '(no member row)'
        print(f"  {u.email}  ->  {role}")
