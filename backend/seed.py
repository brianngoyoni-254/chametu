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
                print(f"Admin already exists: {dev['email']}")
                # Optional: Update the password if they forgot it
                # existing.set_password(dev["password"])
                # db.session.commit()
            else:
                admin = SuperAdmin(email=dev["email"], name=dev["name"])
                admin.set_password(dev["password"])
                db.session.add(admin)
                print(f"Created SuperAdmin: {dev['email']}")
        
        db.session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_superadmin()