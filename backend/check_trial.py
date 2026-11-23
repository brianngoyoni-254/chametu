from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')

from app import create_app, db
from sqlalchemy import inspect, text

app = create_app()
with app.app_context():
    insp = inspect(db.engine)
    tables = insp.get_table_names()
    print("DB HOST:", db.engine.url.host or "(sqlite)")
    print("DB NAME:", db.engine.url.database)
    print("TRIAL TABLES:", [t for t in tables if 'trial' in t.lower()])
    print("TOTAL TABLES:", len(tables))
    if 'chama_trials' in tables:
        print("COLUMNS:", [c['name'] for c in insp.get_columns('chama_trials')])
        print("ROW COUNT:", db.session.execute(text("SELECT COUNT(*) FROM chama_trials")).scalar())
    else:
        print("!! chama_trials MISSING !!")
    try:
        print("ALEMBIC VERSION:", db.session.execute(text("SELECT version_num FROM alembic_version")).scalar())
    except Exception as e:
        print("alembic_version error:", e)
