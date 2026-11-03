# backend/seed.py
from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models.user import SuperAdmin

app = create_app()

def seed_superadmin():
    with app.app_context():
        # Check if the database table exists (optional safety)
        # db.create_all() # Uncomment if you haven't run migrations yet

        print("🌱 Starting SuperAdmin seed...")

        # Define your developers here
        devs = [
            {
                "email": "danny@chametu.co.ke",
                "name": "Danny (Lead Dev)",
                "password": "admin123"
            },
            {
                "email": "brian@chametu.co.ke",
                "name": "Brian (Dev 2)",
                "password": "admin123"
            }
        ]

        for dev in devs:
            # Check if the account already exists
            existing = SuperAdmin.query.filter_by(email=dev["email"]).first()
            
            if existing:
                # Force-reset the password so it always matches what's in this file
                existing.set_password(dev["password"])
                existing.name = dev["name"]
                print(f"Updated password for existing admin: {dev['email']}")
            else:
                admin = SuperAdmin(email=dev["email"], name=dev["name"])
                admin.set_password(dev["password"])
                db.session.add(admin)
                print(f"Created SuperAdmin: {dev['email']}")
        
        db.session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_superadmin()